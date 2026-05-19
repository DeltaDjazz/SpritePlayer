import { useState, useEffect, useMemo, useCallback } from 'react';
import './SpritePlayer.css';

/**
 * Lecteur de sprite sheet en boucle (style GIF), sans backend.
 */
export default function SpritePlayer() {
  const [imageSrc, setImageSrc] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [orientation, setOrientation] = useState('horizontal');
  const [framesInput, setFramesInput] = useState('8');
  const [fps, setFps] = useState(12);
  const [config, setConfig] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setConfig(null);
    setFrameIndex(0);
    setIsPaused(false);
    setNaturalSize({ w: 0, h: 0 });

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
    };
    reader.onerror = () => {
      setError('Lecture du fichier impossible.');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageLoad = useCallback((e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize({ w: naturalWidth, h: naturalHeight });
  }, []);

  const handleValidate = useCallback(() => {
    setError('');
    if (!imageSrc || naturalSize.w === 0) {
      setError('Chargez une image et attendez le chargement.');
      return;
    }
    const n = parseInt(String(framesInput).trim(), 10);
    if (!Number.isFinite(n) || n < 1) {
      setError('Indiquez un nombre de frames ≥ 1.');
      return;
    }

    let frameW;
    let frameH;
    if (orientation === 'horizontal') {
      frameW = naturalSize.w / n;
      frameH = naturalSize.h;
    } else {
      frameW = naturalSize.w;
      frameH = naturalSize.h / n;
    }

    if (!Number.isFinite(frameW) || !Number.isFinite(frameH) || frameW < 1 || frameH < 1) {
      setError('Dimensions de frame invalides.');
      return;
    }

    setConfig({
      frames: n,
      frameW,
      frameH,
      orientation,
      fullW: naturalSize.w,
      fullH: naturalSize.h,
    });
    setFrameIndex(0);
    setIsPaused(false);
  }, [imageSrc, naturalSize, framesInput, orientation]);

  const goPrevFrame = useCallback(() => {
    setFrameIndex((i) => {
      if (!config) return i;
      return (i - 1 + config.frames) % config.frames;
    });
  }, [config]);

  const goNextFrame = useCallback(() => {
    setFrameIndex((i) => {
      if (!config) return i;
      return (i + 1) % config.frames;
    });
  }, [config]);

  const goToStart = useCallback(() => {
    setFrameIndex(0);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  useEffect(() => {
    if (!config || isPaused) return;

    const intervalMs = 1000 / fps;
    const id = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % config.frames);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [fps, config, isPaused]);

  const backgroundPosition = useMemo(() => {
    if (!config) return '0 0';
    if (config.orientation === 'horizontal') {
      return `${-(frameIndex * config.frameW)}px 0`;
    }
    return `0 ${-(frameIndex * config.frameH)}px`;
  }, [config, frameIndex]);

  const previewStyle = useMemo(() => {
    if (!imageSrc || !config) return undefined;
    return {
      width: `${config.frameW}px`,
      height: `${config.frameH}px`,
      backgroundImage: `url(${imageSrc})`,
      backgroundSize: `${config.fullW}px ${config.fullH}px`,
      backgroundPosition,
      backgroundRepeat: 'no-repeat',
    };
  }, [imageSrc, config, backgroundPosition]);

  return (
    <div className="sprite-player" role="region" aria-label="Lecteur de sprite sheet">
      <header className="sprite-player__header">
        <h1 className="sprite-player__title">SpritePlayer</h1>
        <p className="sprite-player__subtitle">
          Aperçu en boucle d&apos;une feuille de sprites (PNG / JPEG)
        </p>
      </header>

      <div className="sprite-player__grid">
        <section className="sprite-player__panel sprite-player__panel--import">
          <h2 className="sprite-player__panel-title">Image</h2>
          <label className="sprite-player__file-label">
            <span className="sprite-player__file-btn">Choisir un fichier</span>
            <input
              type="file"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              className="sprite-player__file-input"
              onChange={handleFileChange}
            />
          </label>
          {naturalSize.w > 0 && (
            <p className="sprite-player__meta">
              {naturalSize.w} × {naturalSize.h} px
            </p>
          )}
        </section>

        <section className="sprite-player__panel sprite-player__panel--config">
          <h2 className="sprite-player__panel-title">Feuille de sprites</h2>

          <fieldset className="sprite-player__fieldset">
            <legend className="sprite-player__legend">Orientation</legend>
            <div className="sprite-player__orientation">
              <label className="sprite-player__radio">
                <input
                  type="radio"
                  name="sprite-orientation"
                  value="horizontal"
                  checked={orientation === 'horizontal'}
                  onChange={() => setOrientation('horizontal')}
                />
                <span>Horizontale ➡️</span>
              </label>
              <label className="sprite-player__radio">
                <input
                  type="radio"
                  name="sprite-orientation"
                  value="vertical"
                  checked={orientation === 'vertical'}
                  onChange={() => setOrientation('vertical')}
                />
                <span>Verticale ⬇️</span>
              </label>
            </div>
          </fieldset>

          <label className="sprite-player__field">
            <span className="sprite-player__label">Nombre d&apos;images (frames)</span>
            <input
              type="number"
              min={1}
              step={1}
              className="sprite-player__input"
              value={framesInput}
              onChange={(e) => setFramesInput(e.target.value)}
            />
          </label>

          <button type="button" className="sprite-player__btn sprite-player__btn--primary" onClick={handleValidate}>
            Valider &amp; Lancer
          </button>
        </section>

        <section className="sprite-player__panel sprite-player__panel--speed">
          <h2 className="sprite-player__panel-title">Vitesse</h2>
          <label className="sprite-player__field sprite-player__field--slider">
            <span className="sprite-player__label">
              FPS : <strong className="sprite-player__fps-value">{fps}</strong>
            </span>
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              className="sprite-player__range"
            />
            <div className="sprite-player__range-ticks" aria-hidden>
              <span>1</span>
              <span>60</span>
            </div>
          </label>
        </section>
      </div>

      {error && <p className="sprite-player__error" role="alert">{error}</p>}

      <section className="sprite-player__preview-wrap" aria-label="Aperçu animation">
        <div className="sprite-player__preview">
          {previewStyle ? (
            <div className="sprite-player__sprite" style={previewStyle} />
          ) : (
            <p className="sprite-player__placeholder">
              {imageSrc
                ? 'Configurez les frames puis cliquez sur « Valider & Lancer ».'
                : 'Importez une image pour commencer.'}
            </p>
          )}
        </div>
        {config && (
          <div className="sprite-player__transport" role="toolbar" aria-label="Contrôles de lecture">
            <span className="sprite-player__frame-badge" aria-live="polite">
              Image {frameIndex + 1} / {config.frames}
              {isPaused ? ' · en pause' : ''}
            </span>
            <div className="sprite-player__transport-btns">
              <button
                type="button"
                className="sprite-player__btn sprite-player__btn--toolbar sprite-player__btn--secondary"
                onClick={goToStart}
                title="Revenir à la première image"
              >
                Début
              </button>
              <button
                type="button"
                className="sprite-player__btn sprite-player__btn--toolbar sprite-player__btn--secondary"
                onClick={goPrevFrame}
                title="Image précédente"
              >
                Précédent
              </button>
              <button
                type="button"
                className="sprite-player__btn sprite-player__btn--toolbar sprite-player__btn--secondary"
                onClick={goNextFrame}
                title="Image suivante"
              >
                Suivant
              </button>
              <button
                type="button"
                className="sprite-player__btn sprite-player__btn--toolbar sprite-player__btn--accent"
                onClick={togglePause}
                aria-pressed={!isPaused}
                title={isPaused ? 'Reprendre la lecture' : 'Mettre en pause'}
              >
                {isPaused ? 'Lecture' : 'Pause'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Image cachée pour lire naturalWidth / naturalHeight */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt=""
          className="sprite-player__hidden-measure"
          onLoad={handleImageLoad}
        />
      )}
    </div>
  );
}
