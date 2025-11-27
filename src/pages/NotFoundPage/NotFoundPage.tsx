import './NotFoundPage.scss'
import type {NotFoundPageProps} from '@/types'

const NotFoundPage = (props: NotFoundPageProps) => {
  const {
    message = 'Страница не найдена :('
  } = props

  return (
    <div className="not-found">
      <h2 className="not-found__text color-primary">{message}</h2>
    </div>
  )
}

export default NotFoundPage