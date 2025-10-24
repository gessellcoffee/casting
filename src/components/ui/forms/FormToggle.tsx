import { ChangeEvent } from 'react';

interface FormToggleProps {
    label?: string;
    error?: string;
    helperText?: string;
    options?: Array<{ value: string; label: string }>;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    checked?: boolean;
    onClick?: () => void;
}

export default function FormToggle({
    label,
    error,
    helperText,
    options,
    checked,
    onChange,
    onClick,
    ...props
}: FormToggleProps) {
    return (
        <div>
            <label className="switch">
                <input 
                id='toggle-switch'
                    type="checkbox" 
                    checked={checked} 
                    onChange={onChange}
                    onClick={onClick} 
                    {...props} 
                />
                <span className="slider round"></span>
            </label>
        </div>
    );
}