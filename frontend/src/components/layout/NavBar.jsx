import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', icon: '⚔️', label: 'Quests' },
  { to: '/stats', icon: '📊', label: 'Stats' },
  { to: '/profile', icon: '👤', label: 'Perfil' },
];

export default function NavBar() {
  return (
    <nav className="nav-bar">
      <div className="nav-bar__inner">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-bar__item ${isActive ? 'nav-bar__item--active' : ''}`
            }
          >
            <span className="nav-bar__icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
