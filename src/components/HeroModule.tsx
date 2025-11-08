import Button from "./Button";
import StarryContainer from "./StarryContainer";
import styles from "./HeroModule.module.css";

interface HeroModuleProps {
  user?: any;
}

export default function HeroModule({ user }: HeroModuleProps) {
    return (
    <StarryContainer starCount={30} className="card m-8 isolate overflow-hidden px-6 lg:px-6">
      {/* Base layer - light in light mode, dark in dark mode */}
      <div className={styles.baseLayer} />
      
      {/* Milky Way diagonal band */}
      <div className={styles.milkyWayBand} />
      
      {/* Bright galactic core clusters - positioned at edges */}
      <div className={styles.coreCluster1} />
      <div className={styles.coreCluster2} />
      
      {/* Dense star cluster regions - at corners */}
      <div className={styles.starCluster1} />
      <div className={styles.starCluster2} />
      
      {/* Bright nebula accents - edge highlights */}
      <div className={styles.nebula1} />
      <div className={styles.nebula2} />
      
      {/* Center overlay - light in light mode, dark in dark mode for text contrast */}
      <div className={styles.centerOverlay} />
      
      <div className="mx-auto max-w-2xl py-20 sm:py-28 lg:py-36 relative z-10">
        <div className="text-center">
          <h1 className={styles.heroTitle}>Belong Here Theater</h1>
          <p className={styles.heroSubtitle}>Change the way you find and post auditions.</p>
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
