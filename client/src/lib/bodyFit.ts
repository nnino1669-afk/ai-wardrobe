import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";

type ClothType = "upper" | "lower" | "overall" | "inner" | "outer";

type Point = { x: number; y: number };

export type BodyFitPlan = {
  confidence: number;
  bodyBox: { x: number; y: number; width: number; height: number };
  shoulderWidth: number;
  hipWidth: number;
  torsoRatio: number;
  fitScale: number;
  verticalAnchor: number;
  detectedAt: number;
};

let detectorPromise: Promise<poseDetection.PoseDetector> | null = null;

async function getDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      await tf.setBackend("webgl");
      await tf.ready();
      return poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      });
    })();
  }
  return detectorPromise;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function keypoint(pose: poseDetection.Pose, name: string): Point | null {
  const point = pose.keypoints.find((candidate) => candidate.name === name && (candidate.score ?? 0) >= 0.25);
  return point ? { x: point.x, y: point.y } : null;
}

export async function detectBodyFitPlan(image: HTMLImageElement, clothType: ClothType): Promise<BodyFitPlan | null> {
  const detector = await getDetector();
  const poses = await detector.estimatePoses(image, { flipHorizontal: false });
  const pose = poses[0];
  if (!pose || pose.keypoints.filter((point) => (point.score ?? 0) >= 0.25).length < 5) return null;

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const visiblePoints = pose.keypoints.filter((point) => (point.score ?? 0) >= 0.25);
  const minX = Math.max(0, Math.min(...visiblePoints.map((point) => point.x)));
  const minY = Math.max(0, Math.min(...visiblePoints.map((point) => point.y)));
  const maxX = Math.min(width, Math.max(...visiblePoints.map((point) => point.x)));
  const maxY = Math.min(height, Math.max(...visiblePoints.map((point) => point.y)));
  const bodyWidth = Math.max(1, maxX - minX);
  const bodyHeight = Math.max(1, maxY - minY);

  const leftShoulder = keypoint(pose, "left_shoulder");
  const rightShoulder = keypoint(pose, "right_shoulder");
  const leftHip = keypoint(pose, "left_hip");
  const rightHip = keypoint(pose, "right_hip");
  const leftShoulderWidth = leftShoulder && rightShoulder ? distance(leftShoulder, rightShoulder) : bodyWidth * 0.35;
  const hipWidth = leftHip && rightHip ? distance(leftHip, rightHip) : bodyWidth * 0.32;
  const shoulderWidth = Math.max(1, leftShoulderWidth);
  const normalizedShoulder = shoulderWidth / width;
  const normalizedHip = Math.max(0.01, hipWidth / width);
  const torsoRatio = Number((normalizedShoulder / normalizedHip).toFixed(4));
  const bodyOccupancy = bodyHeight / height;
  const fitScale = Number(clamp(0.82 + bodyOccupancy * 0.28 + (torsoRatio - 1) * 0.06, 0.78, 1.18).toFixed(4));
  const verticalAnchor = clothType === "lower" ? 0.62 : clothType === "overall" ? 0.5 : clothType === "outer" ? 0.3 : 0.36;
  const confidence = Number((visiblePoints.reduce((sum, point) => sum + (point.score ?? 0), 0) / visiblePoints.length).toFixed(4));

  return {
    confidence,
    bodyBox: {
      x: Number((minX / width).toFixed(4)),
      y: Number((minY / height).toFixed(4)),
      width: Number((bodyWidth / width).toFixed(4)),
      height: Number((bodyHeight / height).toFixed(4)),
    },
    shoulderWidth: Number(normalizedShoulder.toFixed(4)),
    hipWidth: Number(normalizedHip.toFixed(4)),
    torsoRatio,
    fitScale,
    verticalAnchor,
    detectedAt: Date.now(),
  };
}
