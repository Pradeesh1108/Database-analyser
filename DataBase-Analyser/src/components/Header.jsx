import "../css/header.css";

const Header = () => {
  return (
    <div className="h-10 flex items-center justify-center bg-sky-400">
      <div className="w-20 ml-4.5 flex-none">Icon</div>
      <div className="w-64 flex-1 text-center">Database Analyser</div>
      <div className="w-55 flex">
        <ul className="flex gap-5">
          <li><button className="nav-buttons">Home</button></li>
          <li><button className="nav-buttons">About</button></li>
          <li><button className="nav-buttons">Contat</button></li>
        </ul>
      </div>
    </div>
  );
};

export default Header;
