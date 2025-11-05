import Button from "./Button";
import StarryContainer from "./StarryContainer";

interface HeroModuleProps {
  user?: any;
}

export default function HeroModule({ user }: HeroModuleProps) {
    return (
    <StarryContainer starCount={30} className="card m-8 isolate overflow-hidden px-6 lg:px-6">
      {/* Animated gradient background layer */}
      <div 
        className="absolute inset-0 -z-30 bg-gradient-to-br from-[#4a7bd9]/20 via-[#5a8ff5]/10 to-[#94b0f6]/20 animate-[gradient_8s_ease-in-out_infinite]"
        style={{ backgroundSize: '200% 200%' }}
      />
      
      {/* Large dramatic radial gradients for depth */}
      <div className="pointer-events-none absolute -left-32 -top-32 -z-20 h-[48rem] w-[48rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(90,143,245,0.5),rgba(74,123,217,0.3)_40%,transparent_70%)] blur-[80px] opacity-80" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 -z-20 h-[56rem] w-[56rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(30,58,232,0.45),rgba(74,123,217,0.25)_45%,transparent_70%)] blur-[90px] opacity-75" />
      
      {/* Center highlight for visual interest */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-15 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(148,176,246,0.35),rgba(90,143,245,0.15)_50%,transparent_75%)] blur-[60px]" />
      
      {/* Additional accent gradients for contrast */}
      <div className="pointer-events-none absolute top-0 right-1/4 -z-18 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(107,141,214,0.4),transparent_60%)] blur-[70px] opacity-60" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 -z-18 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(74,123,217,0.35),transparent_65%)] blur-[75px] opacity-70" />
      
      {/* Dark overlay vignette for button contrast */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.08)_100%)]" />
      
      <div className="mx-auto max-w-2xl py-20 sm:py-28 lg:py-36 relative z-10">
        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-balance text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] sm:text-7xl drop-shadow-[0_0_20px_rgba(90,143,245,0.6)] pb-2 leading-tight">Belong Here Theater</h1>
          <p className="mt-8 text-lg font-medium text-pretty text-neu-text-primary/95 sm:text-xl/8 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">Change the way you find and post auditions.</p>
        <div className="nav-buttons m-8 flex items-center justify-center gap-4">
            {user ? (
              <>
                <Button text="Audition" href="/auditions" className='m-4 recommended-button'/>
                <Button text="Post an Audition" href="/cast" className='m-4 recommended-button'/>
              </>
            ) : (
              <Button text="Login to Get Started" href="/login" className='m-4'/>
            )}
          </div>
        </div>
      </div>
    </StarryContainer>

    );
}
