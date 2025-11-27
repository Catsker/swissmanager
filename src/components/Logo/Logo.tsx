import './Logo.scss'
import classNames from 'classnames';

interface LogoProps {
  className?: string;
}

const Logo = (props: LogoProps) => {
  const {
    className,
  } = props

  return (
    <a href="/" className={classNames('logo', className)}>
      <img className="logo__img" src="/icons/mainlogo.svg" alt="Swiss Manager" />
    </a>
  )
}

export default Logo