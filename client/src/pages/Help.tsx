import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Users, Shirt, Download, History } from "lucide-react";
import { useLocation } from "wouter";

export default function Help() {
  const [, setLocation] = useLocation();

  const guides = [
    {
      icon: Upload,
      title: "Uploading Photos",
      description: "Learn how to upload person and garment images",
      steps: [
        "Click on the upload area or drag and drop your image",
        "Supported formats: JPG, PNG (max 10MB)",
        "For best results, use clear, well-lit photos",
        "Ensure the person's full body is visible in the photo",
        "Garment images should show the front of the clothing",
      ],
    },
    {
      icon: Users,
      title: "Group Photos",
      description: "How to use AI Wardrobe with multiple people",
      steps: [
        "Upload a photo with multiple people",
        "Select 'Yes, it's a group' when prompted",
        "Click on the person you want to try on the garment",
        "Draw a bounding box around the person (optional)",
        "The AI will apply the garment to the selected person",
      ],
    },
    {
      icon: Shirt,
      title: "Garment Types",
      description: "Understanding different garment categories",
      steps: [
        "Upper Body: Shirts, tops, blouses, sweaters",
        "Lower Body: Pants, skirts, shorts, jeans",
        "Full Outfit: Dresses, jumpsuits, full-body garments",
        "Inner Layer: T-shirts, undershirts, base layers",
        "Outer Layer: Jackets, coats, blazers, cardigans",
      ],
    },
    {
      icon: Download,
      title: "Downloading Results",
      description: "Save your virtual try-on results",
      steps: [
        "After the AI generates the try-on, you'll see the result",
        "Use the before/after slider to compare the original and result",
        "Click 'Download Result' to save the image to your device",
        "Images are saved as PNG files with high quality",
        "Downloaded images can be shared on social media",
      ],
    },
    {
      icon: History,
      title: "Try-On History",
      description: "Manage your generated try-ons",
      steps: [
        "All your try-ons are automatically saved to your history",
        "Visit the History page to view all past try-ons",
        "Download any previous result at any time",
        "Delete try-ons you no longer need",
        "Filter by garment type to find specific try-ons",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Help & Documentation</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {/* Introduction */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-accent/10 to-accent/5">
          <h2 className="text-2xl font-bold mb-4">Welcome to AI Wardrobe</h2>
          <p className="text-lg text-muted-foreground mb-4">
            AI Wardrobe uses advanced artificial intelligence to let you visualize how clothes look on you or your friends before buying. This guide will help you get the most out of the application.
          </p>
          <p className="text-muted-foreground">
            Have questions? Each section below covers a specific feature with step-by-step instructions.
          </p>
        </Card>

        {/* Guides Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {guides.map((guide, index) => {
            const Icon = guide.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg">{guide.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {guide.description}
                </p>
                <ol className="space-y-2">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="text-sm text-muted-foreground flex gap-2">
                      <span className="font-semibold text-accent min-w-fit">
                        {stepIndex + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What image formats are supported?</h3>
              <p className="text-muted-foreground">
                We support JPG and PNG formats. Images must be smaller than 10MB. For best results, use high-quality images with good lighting.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">How accurate is the virtual try-on?</h3>
              <p className="text-muted-foreground">
                Our AI model is trained to accurately simulate how garments fit and drape on different body types. However, results may vary based on image quality, lighting, and garment complexity. We recommend using clear, well-lit photos for best results.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Can I use group photos?</h3>
              <p className="text-muted-foreground">
                Yes! You can upload group photos and select which person should try on the garment. Simply mark the person you want to apply the garment to, and the AI will process only that person.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">How long does it take to generate a try-on?</h3>
              <p className="text-muted-foreground">
                Processing typically takes 30-60 seconds depending on image size and server load. You'll see a loading indicator while the AI is working.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Can I download my results?</h3>
              <p className="text-muted-foreground">
                Absolutely! After generating a try-on, you can download the result as a high-quality PNG image. All your past results are also saved in your History for future reference.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Is my data private?</h3>
              <p className="text-muted-foreground">
                Your images and try-on results are stored securely and are only accessible to you. We do not share your data with third parties or use it for training purposes.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What if the try-on doesn't look right?</h3>
              <p className="text-muted-foreground">
                If results aren't satisfactory, try uploading higher-quality images or different angles. Ensure the person's full body is visible and the garment image clearly shows the front of the clothing.
              </p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => setLocation("/studio")}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            size="lg"
          >
            Go to Studio
          </Button>
        </div>
      </div>
    </div>
  );
}
