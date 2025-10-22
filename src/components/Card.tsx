import Button from "./Button";
import StarryContainer from "./StarryContainer";

type ButtonProps = {
    text: string;
    href: string;
};

export default function Card({title, description, imageSrc, primaryButton, secondaryButton}: {title: string, description: string, imageSrc?: string, primaryButton?: ButtonProps, secondaryButton?: ButtonProps}) {
    
    return (
        <StarryContainer className="card" starCount={5}>
            <div className="card-image">
                <img src={imageSrc} />
            </div>
            <div className="card-content">
                <h2 className="text-3xl font-semibold">{title}</h2>
                <p className="text-lg font-medium">{description}</p>
                <div className="nav-buttons">
                    {primaryButton && <Button text={primaryButton.text} href={primaryButton.href} />}
                    {secondaryButton && <Button text={secondaryButton.text} href={secondaryButton.href} />}
                </div>
            </div>
        </StarryContainer>
    )
}