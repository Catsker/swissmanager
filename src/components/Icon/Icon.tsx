import './Icon.scss';
import type {IconProps} from '@/types'

const Icon = (props: IconProps) => {
  const { name,
    size,
    className = '',
    alt = '',
  } = props

  return (
    <img
      src={`/icons/${name}.svg`}
      alt={alt}
      className={`icon ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default Icon;