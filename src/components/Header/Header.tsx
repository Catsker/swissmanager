import './Header.scss'
import Logo from "@/components/Logo";

const Header = () => {
  return (
    <header className="header">
      <div className="header__inner">
        <Logo className="header__logo"/>
        <h1 className="header__title">Swiss Manager</h1>
      </div>
    </header>
  )
}

export default Header