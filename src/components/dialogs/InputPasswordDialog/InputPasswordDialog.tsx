import './InputPasswordDialog.scss'
import type {InputPasswordDialogProps} from '@/types'
import Button from "@/components/Button";
import React, {useEffect, useRef, useState} from "react";

const InputPasswordDialog = (props: InputPasswordDialogProps) => {
  const {
    isOpen,
    isCreation = false,
    onClose,
    onSubmit
  } = props;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      setPassword("");
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    try {
      const result = await onSubmit(password);

      if (!result) {
        const errorMessage = isCreation
          ? 'Пароль должен содержать минимум 8 символов.'
          : 'Неверный пароль. Попробуйте снова.';
        setError(errorMessage);
      }
    }
    catch (error) {
      setError('Не удалось проверить пароль, попробуйте снова')
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password) {
      handleConfirm();
    }
  };

  return (
    <dialog ref={dialogRef} className="input-password-dialog" onCancel={onClose}>
      <form className="input-password-dialog__content" onSubmit={handleConfirm}>
        <label htmlFor="tournament-password">
          <h3 className="input-password-dialog__title">
            {isCreation ? 'Придумайте пароль для турнира' : 'Вы пытаетесь войти как редактор. Введите пароль'}
          </h3>
        </label>
        <input
          id="tournament-password"
          autoComplete={isCreation ? 'new-password' : 'on'}
          name="tournament-password"
          type="password"
          className="basicInput"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите пароль"
          autoFocus
        />

        {error && <p className="input-password-dialog__error">{error}</p>}

        <div className='input-password-dialog__buttons'>
          <Button
            className="input-password-dialog__button btn"
            type="submit"
            disabled={!password.trim()}
          >
            {isCreation ? 'Создать турнир' : 'Ввести'}
          </Button>
          <Button
            className="input-password-dialog__button btn"
            onClick={onClose}
            variant={isCreation ? 'passive' : 'transparent'}
          >
            {isCreation ? 'Отмена' : 'Продолжить как наблюдатель'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}

export default InputPasswordDialog;