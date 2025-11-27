import {useEffect, useRef} from "react";
import Button from "@/components/Button";
import "./ConfirmDialog.scss";
import type {ConfirmDialogProps} from '@/types'
import classNames from "classnames";

const ConfirmDialog = (props: ConfirmDialogProps) => {
  const {
    isOpen,
    entityName,
    onClose,
    onConfirm,
    isWarning = false,
    agreementText = 'Да',
    rejectionText = 'Нет',
  } = props;

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog ref={dialogRef} className="confirm-dialog" onCancel={onClose}>
      <div className={`confirm-dialog__content`}>
        <h3 className="confirm-dialog__title">Подтвердите действие</h3>
        <p className="confirm-dialog__text">
          {entityName}
        </p>
        <div className={classNames('confirm-dialog__buttons', {
          'confirm-dialog__buttons--wide': !isWarning
        })}>
          <Button
            className="confirm-dialog__button btn"
            variant={isWarning ? 'primary' : 'passive'}
            onClick={onClose}
          >
            {rejectionText}
          </Button>
          <Button
            className="confirm-dialog__button btn"
            variant={isWarning ? 'transparent-danger' : 'primary'}
            onClick={onConfirm}
          >
            {agreementText}
          </Button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;
