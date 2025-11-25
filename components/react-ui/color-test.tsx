/**
 * Color Test Component
 * 
 * This component displays all Kounted brand colors to verify they're working correctly.
 * You can import this component temporarily to test the colors, then remove it.
 * 
 * Usage:
 * import { ColorTest } from '@/components/react-ui/color-test'
 * 
 * <ColorTest />
 */

import { KountedColors } from '@/lib/config/colors'

export function ColorTest() {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4">Kounted Brand Colors Test</h2>
        <p className="text-muted-foreground mb-4">
          This component tests all Kounted brand color utilities to verify they're working correctly.
        </p>
      </div>

      {/* Background Colors */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Background Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="bg-kounted-green h-24 rounded-lg shadow-md flex items-center justify-center">
              <span className="text-white font-medium">Green</span>
            </div>
            <p className="text-xs text-center">bg-kounted-green</p>
            <p className="text-xs text-center text-muted-foreground">{KountedColors.green}</p>
          </div>
          
          <div className="space-y-2">
            <div className="bg-kounted-charcoal h-24 rounded-lg shadow-md flex items-center justify-center">
              <span className="text-white font-medium">Charcoal</span>
            </div>
            <p className="text-xs text-center">bg-kounted-charcoal</p>
            <p className="text-xs text-center text-muted-foreground">{KountedColors.charcoal}</p>
          </div>
          
          <div className="space-y-2">
            <div className="bg-kounted-dark h-24 rounded-lg shadow-md flex items-center justify-center">
              <span className="text-white font-medium">Dark</span>
            </div>
            <p className="text-xs text-center">bg-kounted-dark</p>
            <p className="text-xs text-center text-muted-foreground">{KountedColors.dark}</p>
          </div>
          
          <div className="space-y-2">
            <div className="bg-kounted-light h-24 rounded-lg shadow-md border border-zinc-200 flex items-center justify-center">
              <span className="text-zinc-900 font-medium">Light</span>
            </div>
            <p className="text-xs text-center">bg-kounted-light</p>
            <p className="text-xs text-center text-muted-foreground">{KountedColors.light}</p>
          </div>
        </div>
      </section>

      {/* Text Colors */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Text Colors</h3>
        <div className="space-y-2 bg-white p-4 rounded-lg border">
          <p className="text-kounted-green font-semibold">This text uses text-kounted-green</p>
          <p className="text-kounted-charcoal font-semibold">This text uses text-kounted-charcoal</p>
          <p className="text-kounted-dark font-semibold">This text uses text-kounted-dark</p>
          <div className="bg-zinc-900 p-2 rounded">
            <p className="text-kounted-light font-semibold">This text uses text-kounted-light</p>
          </div>
        </div>
      </section>

      {/* Opacity Variants */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Opacity Variants</h3>
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <div className="bg-kounted-green h-12 w-24 rounded"></div>
            <div className="bg-kounted-green/90 h-12 w-24 rounded"></div>
            <div className="bg-kounted-green/75 h-12 w-24 rounded"></div>
            <div className="bg-kounted-green/50 h-12 w-24 rounded"></div>
            <div className="bg-kounted-green/25 h-12 w-24 rounded"></div>
            <div className="bg-kounted-green/10 h-12 w-24 rounded"></div>
          </div>
          <p className="text-xs text-muted-foreground">
            bg-kounted-green with opacity: 100%, 90%, 75%, 50%, 25%, 10%
          </p>
        </div>
      </section>

      {/* Border Colors */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Border Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border-4 border-kounted-green h-24 rounded-lg flex items-center justify-center">
            <span className="text-xs">Green Border</span>
          </div>
          <div className="border-4 border-kounted-charcoal h-24 rounded-lg flex items-center justify-center">
            <span className="text-xs">Charcoal Border</span>
          </div>
          <div className="border-4 border-kounted-dark h-24 rounded-lg flex items-center justify-center">
            <span className="text-xs">Dark Border</span>
          </div>
          <div className="border-4 border-kounted-light h-24 rounded-lg flex items-center justify-center bg-zinc-100">
            <span className="text-xs">Light Border</span>
          </div>
        </div>
      </section>

      {/* Interactive States */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Interactive States</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button className="bg-kounted-green text-white hover:bg-kounted-green/90 transition-colors px-4 py-3 rounded-lg font-medium">
            Hover Me (Green)
          </button>
          <button className="bg-kounted-charcoal text-white hover:bg-kounted-charcoal/90 transition-colors px-4 py-3 rounded-lg font-medium">
            Hover Me (Charcoal)
          </button>
          <button className="border-2 border-kounted-green text-kounted-green hover:bg-kounted-green hover:text-white transition-colors px-4 py-3 rounded-lg font-medium">
            Hover Me (Outline)
          </button>
        </div>
      </section>

      {/* Button Component Test */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Button Component (variant="green")</h3>
        <div className="flex gap-4 items-center">
          <button className="bg-kounted-green text-white shadow-sm hover:bg-kounted-green/90 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium h-10 px-4 py-2">
            Green Button
          </button>
          <p className="text-sm text-muted-foreground">
            This uses the exact classes from the Button component's green variant
          </p>
        </div>
      </section>

      {/* CSS Variables Test */}
      <section>
        <h3 className="text-lg font-semibold mb-3">CSS Variables (Direct Usage)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            style={{ backgroundColor: 'var(--kounted-green)' }} 
            className="h-24 rounded-lg shadow-md flex items-center justify-center text-white font-medium"
          >
            CSS Var Green
          </div>
          <div 
            style={{ backgroundColor: 'var(--kounted-charcoal)' }} 
            className="h-24 rounded-lg shadow-md flex items-center justify-center text-white font-medium"
          >
            CSS Var Charcoal
          </div>
          <div 
            style={{ backgroundColor: 'var(--kounted-dark)' }} 
            className="h-24 rounded-lg shadow-md flex items-center justify-center text-white font-medium"
          >
            CSS Var Dark
          </div>
          <div 
            style={{ backgroundColor: 'var(--kounted-light)' }} 
            className="h-24 rounded-lg shadow-md border border-zinc-200 flex items-center justify-center text-zinc-900 font-medium"
          >
            CSS Var Light
          </div>
        </div>
      </section>

      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          ✅ If you can see all colors correctly, the custom color configuration is working!
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Color values: Green ({KountedColors.green}), Charcoal ({KountedColors.charcoal}), 
          Dark ({KountedColors.dark}), Light ({KountedColors.light})
        </p>
      </div>
    </div>
  )
}

