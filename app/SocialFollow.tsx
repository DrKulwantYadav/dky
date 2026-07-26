type SocialName = "instagram" | "youtube" | "facebook" | "whatsapp" | "google";

function SocialIcon({ name }: { name: SocialName }) {
  if (name === "instagram") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle className="icon-dot" cx="17.4" cy="6.7" r="1.1"/></svg>;
  if (name === "youtube") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.4 7.2a2.7 2.7 0 0 0-1.9-1.9C17.8 4.8 12 4.8 12 4.8s-5.8 0-7.5.5a2.7 2.7 0 0 0-1.9 1.9A28 28 0 0 0 2.1 12a28 28 0 0 0 .5 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.5.5 7.5.5s5.8 0 7.5-.5a2.7 2.7 0 0 0 1.9-1.9 28 28 0 0 0 .5-4.8 28 28 0 0 0-.5-4.8Z"/><path className="icon-cutout" d="m10 15.4 5.2-3.4L10 8.6v6.8Z"/></svg>;
  if (name === "facebook") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.4 22v-8h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.7-1.6h1.7V4.3c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2.1H8V14h2.8v8h3.6Z"/></svg>;
  if (name === "whatsapp") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4h.1c6.5 0 11.7-5.3 11.7-11.8 0-3.1-1.2-6.1-3.5-8.4Zm-8.3 18.2c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.8 1 1-3.7-.2-.4a9.8 9.8 0 1 1 8.3 4.6Zm5.4-7.3c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.3-.4.3-.7.1-1.8-.9-3-1.7-4.2-3.8-.3-.5.3-.5.9-1.7.1-.2.1-.4 0-.6l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.4-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.6c.2.2 2.4 3.7 5.9 5.2 2.2.9 3.1 1 4.2.8.7-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.2-.4-.3-.7-.4Z"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path className="google-blue" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4h5.4a4.7 4.7 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z"/><path className="google-green" d="M12 22c2.7 0 5-.9 6.7-2.4L15.4 17c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10 10 0 0 0 12 22Z"/><path className="google-yellow" d="M6.5 13.9a6 6 0 0 1 0-3.8V7.4H3.1a10 10 0 0 0 0 9.2l3.4-2.7Z"/><path className="google-red" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z"/></svg>;
}

export default function SocialFollow() {
  return <div className="footer-social" aria-label="Follow Dr. Kulwant Yadav">
    <strong>Follow Dr. Kulwant Yadav</strong>
    <nav>
      <a className="social-instagram" href="https://www.instagram.com/drkulwantyadavmedicine?igsh=MTh6cjJvMWV5NGZvOQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer"><span className="footer-social-icon"><SocialIcon name="instagram"/></span>Instagram</a>
      <a className="social-youtube" href="https://youtube.com/@medicinesquarebydrkulwant?si=Rn9kcmv7AeleTNkF" target="_blank" rel="noopener noreferrer"><span className="footer-social-icon"><SocialIcon name="youtube"/></span>YouTube</a>
      <a className="social-facebook" href="https://www.facebook.com/share/1EDnNWKTW1/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"><span className="footer-social-icon"><SocialIcon name="facebook"/></span>Facebook</a>
      <a className="social-whatsapp" href="https://wa.me/919205775932" target="_blank" rel="noopener noreferrer"><span className="footer-social-icon"><SocialIcon name="whatsapp"/></span>WhatsApp</a>
      <a className="social-google" href="https://share.google/NRSnun2Z3rW8XpbU5" target="_blank" rel="noopener noreferrer"><span className="footer-social-icon"><SocialIcon name="google"/></span>Google</a>
    </nav>
    <p className="content-review">Content reviewed by: <strong>Dr. Kulwant Yadav</strong></p>
  </div>;
}
