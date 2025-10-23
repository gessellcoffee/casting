import Button from "./Button";

type ButtonProps = {
    text: string;
    href: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
};

export default function Card({title, description, imageSrc, primaryButton, secondaryButton, className = ''}: {title: string, description: string, imageSrc?: string, primaryButton?: ButtonProps, secondaryButton?: ButtonProps, className?: string}) {
    
    return (
        <div className={`card ${className}`}>
            {imageSrc && (
                <div className="mb-6 rounded-2xl overflow-hidden shadow-neu-raised">
                    <img src={imageSrc} alt={title} className="w-full h-auto object-cover" />
                </div>
            )}
            <div className="card-content">
                <h2 className="text-3xl font-bold text-neu-text-primary mb-4">{title}</h2>
                <p className="text-lg text-neu-text-secondary mb-6">{description}</p>
                {(primaryButton || secondaryButton) && (
                    <div className="flex gap-3 flex-wrap">
                        {primaryButton && <Button text={primaryButton.text} href={primaryButton.href} variant={primaryButton.variant || 'primary'} />}
                        {secondaryButton && <Button text={secondaryButton.text} href={secondaryButton.href} variant={secondaryButton.variant || 'secondary'} />}
                    </div>
                )}
            </div>
        </div>
    )
}