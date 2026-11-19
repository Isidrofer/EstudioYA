export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border py-6 text-center text-sm text-muted-foreground">
      <p>
        © {year} EstudioYA · Hecho por estudiantes, para estudiantes · Argentina
      </p>
    </footer>
  );
}
