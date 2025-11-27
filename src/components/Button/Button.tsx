import './Button.scss';
import classNames from "classnames";
import type {ButtonProps} from '@/types'

const Button = (props: ButtonProps) => {
  const {
    children,
    onClick,
    className = '',
    type = 'button',
    disabled = false,
    variant = 'primary',
    href,
    target = '_self',
  } = props

  const isLink = href !== undefined
  const Component = isLink ? 'a' : 'button'
  const linkProps = { href, target }
  const buttonProps = { type, onClick, disabled }
  const specificProps = isLink ? linkProps : buttonProps

  return (
    <Component
      className={classNames('btn', `btn--${variant}`, className)}
      {...specificProps}>
      {children}
    </Component>
  );
};

export default Button;