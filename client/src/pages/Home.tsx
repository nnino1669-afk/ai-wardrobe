import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Users, Zap, Download } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation("/try-on");
    } else {
      startLogin();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">AI Wardrobe</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => setLocation("/try-on")} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Open Studio
              </Button>
            ) : (
              <Button onClick={startLogin} className="bg-primary hover:bg-primary/90">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              See Clothes Before You Buy
            </h1>
            <p className="text-xl text-muted-foreground">
              Experience the future of fashion with AI-powered virtual try-on. 
              Visualize any garment on yourself or your friends with photorealistic accuracy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-base h-12 px-8"
            >
              Try Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-base h-12 px-8"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Hero Visual Placeholder */}
        <div className="mt-16 md:mt-24 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border aspect-video flex items-center justify-center">
          <div className="text-center space-y-4">
            <Sparkles className="w-16 h-16 mx-auto text-primary/40" />
            <p className="text-muted-foreground">Virtual try-on preview</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need for realistic virtual try-on
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Photorealistic Results</h3>
                  <p className="text-muted-foreground">
                    Advanced AI preserves fabric textures, shadows, and body contours for authentic results.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Group Photos</h3>
                  <p className="text-muted-foreground">
                    Try on clothes on any person in group photos. Click to select who gets the new look.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Easy Export</h3>
                  <p className="text-muted-foreground">
                    Download results instantly. Compare before and after with our built-in slider.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">All Garment Types</h3>
                  <p className="text-muted-foreground">
                    Upper body, lower body, dresses, jackets—any clothing type works perfectly.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-primary/5 to-accent/5 border border-border rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Fashion?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start creating realistic virtual try-ons in seconds.
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground text-base h-12 px-8"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-20">
        <div className="container text-center text-muted-foreground text-sm">
          <p>© 2026 AI Wardrobe. Powered by advanced AI technology.</p>
        </div>
      </footer>
    </div>
  );
}
