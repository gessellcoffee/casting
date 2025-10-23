import Button from "./Button";
import StarryContainer from "./StarryContainer";

interface HeroModuleProps {
  user?: any;
}

export default function HeroModule({ user }: HeroModuleProps) {
    return (
    <StarryContainer starCount={20} className="card m-8 isolate overflow-hidden px-6 lg:px-6">
      <div className="absolute inset-0 -z-20 text-center" />
      <div className="pointer-events-none absolute -left-20 -top-24 -z-10 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(90,143,245,0.35),transparent_60%)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 -z-10 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(30,58,232,0.25),transparent_60%)] blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(74,123,217,0.2),transparent_70%)] blur-2xl" />
      <div className="mx-auto max-w-2xl py-20 sm:py-28 lg:py-36">
        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-balance text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] sm:text-7xl drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2 leading-tight">Belong Here Theater</h1>
          <p className="mt-8 text-lg font-medium text-pretty text-neu-text-primary/90 sm:text-xl/8">Change the way you find and post auditions.</p>
        <div className="nav-buttons m-8 flex items-center justify-center gap-4">
            {user ? (
              <>
                <Button text="Audition" href="/auditions" className='m-4'/>
                <Button text="Post an Audition" href="/cast" className='m-4'/>
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
