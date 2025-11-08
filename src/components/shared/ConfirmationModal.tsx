import React from 'react';
import Button from '@/components/Button';
import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancel?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  showCancel = true
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className='neu-card-raised p-4 hover:shadow-neu-raised-lg transition-all' onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttons}>
          {showCancel && (
            <Button
              text={cancelButtonText}
              onClick={onCancel}
              variant="secondary"
            />
          )}
          <Button
            text={confirmButtonText}
            onClick={onConfirm}
            variant={showCancel ? "danger" : "primary"}
          />
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
