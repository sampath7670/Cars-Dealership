import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function Register({ onLogin }) {
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { const result = await api('register',data); onLogin(result.username); navigate('/'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <section className="auth-wrap"><div className="auth-story"><p className="eyebrow">JOIN THE COMMUNITY</p><h1>Your next chapter<br/>starts here.</h1><p>Save your voice for the road ahead. Create an account to share your dealership experience.</p></div><form className="form-card" onSubmit={submit}><p className="eyebrow">WELCOME TO CARS DEALERSHIP</p><h2>Create your account</h2>
    <label>Username<input name="username" autoComplete="username" maxLength="150" required/></label>
    <div className="two-col"><label>First Name<input name="first_name" autoComplete="given-name" maxLength="150" required/></label><label>Last Name<input name="last_name" autoComplete="family-name" maxLength="150" required/></label></div>
    <label>Email<input name="email" type="email" autoComplete="email" required/></label>
    <label>Password<input name="password" type="password" autoComplete="new-password" minLength="8" required/></label><small>Use at least 8 characters. Avoid common or entirely numeric passwords.</small>
    {error && <p role="alert" className="error">{error}</p>}<button className="button" disabled={busy}>{busy?'Creating account…':'Register'}</button><p>Already registered? <Link to="/login">Log in</Link></p>
  </form></section>;
}
