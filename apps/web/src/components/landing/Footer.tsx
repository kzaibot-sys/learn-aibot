export function Footer() {
  return (
    <footer className="border-t border-dark-border py-12 px-4">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} LMS Platform. Все права защищены.
        </p>
        <div className="flex gap-6 text-sm text-zinc-500">
          <a href="#" className="hover:text-zinc-300 transition-colors">Политика конфиденциальности</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Условия использования</a>
        </div>
      </div>
    </footer>
  );
}
