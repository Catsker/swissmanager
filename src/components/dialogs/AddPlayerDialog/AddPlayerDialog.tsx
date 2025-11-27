import './AddPlayerDialog.scss';
import React, {useRef, useEffect, useState} from "react";
import type {AddPlayerDialogProps} from '@/types'
import Button from "@/components/Button";

const AddPlayerDialog = ({isOpen, onClose, onAdd}: AddPlayerDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const defaultRating = 1500

  const [name, setName] = useState("");
  const [rating, setRating] = useState<number>(defaultRating);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(name.trim(), rating);
    setName('')
    setRating(defaultRating)
    onClose();
  };

  return (
    <dialog ref={dialogRef} className="add-player-dialog rounded">
      <form className="add-player-dialog__content" onSubmit={handleSubmit}>
        <fieldset className="add-player-dialog__fieldset">
          <div className="add-player-dialog__field">
            <label htmlFor="player-name" className="add-player-dialog__label">
              Имя игрока *
            </label>
            <input
              id="player-name"
              className="basicInput"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="add-player-dialog__field">
            <label htmlFor="player-rating" className="add-player-dialog__label">
              Рейтинг
            </label>
            <input
              id="player-rating"
              className="basicInput removeInputArrows"
              type="number"
              value={rating}
              onChange={(e) => setRating(+e.target.value)}
              min="100"
              max="9999"
              required
            />
          </div>
        </fieldset>

        <menu className="add-player-dialog__buttons">
          <Button
            type="submit"
            disabled={name.length === 0}
          >
            Добавить
          </Button>
          <Button
            type="button"
            variant="passive"
            onClick={onClose}
          >
            Отмена
          </Button>
        </menu>
      </form>
    </dialog>
  );
};

export default AddPlayerDialog;
