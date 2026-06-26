import { useStore } from '../store/useStore.jsx'
import { IconGoogle, IconCloud } from '../components/Icons.jsx'

export default function LoginView() {
  const { auth } = useStore()
  const loading = auth.status === 'loading'

  return (
    <div className="login">
      <div className="login__card fade-in stagger-1">
        <div className="brand__mark login__mark">S</div>
        <h1 className="login__title">Skarbnik <em>Klasowy</em></h1>
        <p className="login__lead">
          Zaloguj się, aby Twoje składki, zbiórki i wydatki były bezpiecznie
          zapisane w chmurze i dostępne na każdym urządzeniu.
        </p>

        <button
          className="btn btn--light btn--block login__btn"
          onClick={auth.signIn}
          disabled={loading}
        >
          <IconGoogle width={20} height={20} />
          {loading ? 'Łączenie…' : 'Zaloguj się przez Google'}
        </button>

        {auth.error && <p className="login__error">{auth.error}</p>}

        <div className="login__note">
          <IconCloud width={16} height={16} />
          <span>Dane synchronizowane w czasie rzeczywistym (Firebase)</span>
        </div>
      </div>
    </div>
  )
}
