import { useTranslation } from 'react-i18next';
import ScreenContainer from '../components/layout/ScreenContainer';
import LocalizedLink from '../components/layout/LocalizedLink';

export default function LandingPage() {
  const { t } = useTranslation('common');

  const features = [
    {
      icon: '✦',
      title: t('home.feature1Title'),
      desc: t('home.feature1Desc'),
    },
    {
      icon: '◈',
      title: t('home.feature2Title'),
      desc: t('home.feature2Desc'),
    },
    {
      icon: '⬡',
      title: t('home.feature3Title'),
      desc: t('home.feature3Desc'),
    },
  ];

  return (
    <ScreenContainer>
      <div className="container-app px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="flex flex-col items-center text-center pt-24 pb-20">

          <div className="sg-pill px-5 py-2 text-xs font-semibold tracking-widest uppercase mb-10"
            style={{ color: '#7A6A50' }}>
            Your Intelligent Travel Companion
          </div>

          <h1 className="text-7xl sm:text-8xl font-bold tracking-tight leading-none mb-6"
            style={{ color: '#2A1F0E' }}>
            Superguide
          </h1>

          <p className="text-base max-w-lg mb-8 leading-relaxed" style={{ color: '#7A6A50' }}>
            Planning the perfect trip often feels like an impossible puzzle.
            Superguide transforms this chaos into a smart, personalized itinerary—automatically.
          </p>

          <div className="sg-card px-7 py-4 mb-12 max-w-sm w-full">
            <p className="text-sm italic leading-relaxed text-center" style={{ color: '#7A6A50' }}>
              "{t('home.tagline')}"
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <LocalizedLink to="/get-started">
              <button className="sg-btn px-8 py-3.5 text-sm">
                Plan a Trip
              </button>
            </LocalizedLink>
            <LocalizedLink to="/histories">
              <button className="sg-pill px-8 py-3.5 text-sm font-semibold transition-colors"
                style={{ color: '#7A6A50' }}>
                My Trips
              </button>
            </LocalizedLink>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto pb-28">
          {features.map((f, i) => (
            <div key={i} className="sg-card p-7 transition-transform hover:scale-[1.02]">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg mb-5"
                style={{ background: 'rgba(107,122,78,0.15)', color: '#6B7A4E' }}>
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#2A1F0E' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#A89070' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </ScreenContainer>
  );
}
