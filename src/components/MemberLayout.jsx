import React from 'react';
import { LayoutDashboard, CalendarCheck, Lightbulb, CreditCard, Info, CircleHelp, Wallet, Gamepad2, Vote} from 'lucide-react';

const memberNav = [
  { label: 'Home', icon: LayoutDashboard },
  { label: 'Gallery & Events', icon: CalendarCheck },
  { label: 'Business Ideas', icon: Lightbulb },
  { label: 'Fun Time', icon: Gamepad2 },
  { label: 'Donate / Contributions', icon: CreditCard },
  { label: 'My Attendance & Deposits', icon: Wallet },
  { label: 'About Us', icon: Info },
  { label: 'Contact Us', icon: CircleHelp },
  { label: 'Elections & Voting', icon: Vote },
];

export default function MemberLayout({ section, setSection }) {
  return (
    <div className="member-top-nav">
      {memberNav.map((item) => {
        const Icon = item.icon;
        const isActive = section === item.label;
        return (
          <button
            key={item.label}
            type="button"
            className={`member-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSection(item.label)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}