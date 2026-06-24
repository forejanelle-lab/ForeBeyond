import { brand, colors } from "@/lib/brand";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export const metadata = {
  title: "Design System",
};

const colorSwatches = [
  { name: "Forest Green", token: "forest", hex: colors.forest, usage: "Primary brand, headings, CTAs" },
  { name: "Sage Green", token: "sage", hex: colors.sage, usage: "Backgrounds, secondary surfaces" },
  { name: "Warm Cream", token: "cream", hex: colors.cream, usage: "Page background" },
  { name: "White", token: "white", hex: colors.white, usage: "Cards, elevated surfaces" },
  { name: "Charcoal", token: "charcoal", hex: colors.charcoal, usage: "Body text" },
  { name: "Accent Gold", token: "gold", hex: colors.gold, usage: "Accents, badges, highlights" },
];

export default function DesignSystemPage() {
  return (
    <>
      <Section background="forest" className="!py-16">
        <Container>
          <h1 className="text-4xl font-bold text-white">{brand.name} Design System</h1>
          <p className="mt-2 text-white/70">
            Apple clarity + Airbnb warmth + Notion simplicity
          </p>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="text-2xl font-bold text-forest mb-8">Colors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {colorSwatches.map((color) => (
              <Card key={color.token} variant="outline" padding="sm">
                <div
                  className="h-20 rounded-xl mb-3 border border-sage-dark/20"
                  style={{ backgroundColor: color.hex }}
                />
                <h3 className="font-semibold text-forest">{color.name}</h3>
                <p className="text-sm text-charcoal-light font-mono">{color.hex}</p>
                <p className="text-xs text-charcoal-light mt-1">{color.usage}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="cream">
        <Container>
          <h2 className="text-2xl font-bold text-forest mb-8">Typography</h2>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-charcoal-light mb-1">Display / H1</p>
              <p className="text-4xl font-bold text-forest">{brand.tagline}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal-light mb-1">H2</p>
              <p className="text-3xl font-bold text-forest">Section Heading</p>
            </div>
            <div>
              <p className="text-xs text-charcoal-light mb-1">H3</p>
              <p className="text-xl font-semibold text-forest">Card Title</p>
            </div>
            <div>
              <p className="text-xs text-charcoal-light mb-1">Body</p>
              <p className="text-base text-charcoal leading-relaxed">{brand.mission}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal-light mb-1">Secondary Tagline</p>
              <p className="text-sm text-charcoal-light italic">{brand.secondaryTagline}</p>
            </div>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="text-2xl font-bold text-forest mb-8">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="gold">Gold</Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </Container>
      </Section>

      <Section background="sage">
        <Container>
          <h2 className="text-2xl font-bold text-forest mb-8">Form Elements</h2>
          <div className="max-w-md space-y-4">
            <Input label="Text Input" placeholder="Enter text..." />
            <Textarea label="Textarea" placeholder="Enter longer text..." />
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <h2 className="text-2xl font-bold text-forest mb-8">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="gold">Gold</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Container>
      </Section>

      <Section background="cream">
        <Container>
          <h2 className="text-2xl font-bold text-forest mb-8">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default" padding="md">
              <h3 className="font-semibold text-forest">Default Card</h3>
              <p className="text-sm text-charcoal-light mt-2">With shadow-md elevation</p>
            </Card>
            <Card variant="elevated" padding="md">
              <h3 className="font-semibold text-forest">Elevated Card</h3>
              <p className="text-sm text-charcoal-light mt-2">With shadow-xl elevation</p>
            </Card>
            <Card variant="outline" padding="md">
              <h3 className="font-semibold text-forest">Outline Card</h3>
              <p className="text-sm text-charcoal-light mt-2">With border, no shadow</p>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
