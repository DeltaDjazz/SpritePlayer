import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './SpritePlayer.css';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const FRAME_FPS_OVERRIDE_MIN = 1;
const FRAME_FPS_OVERRIDE_MAX = 48;

function isImageFile(file) {
  if (!file) return false;
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  return /\.(png|jpe?g)$/i.test(file.name);
}

function getFrameLabel(index, config, hasEmptyTail) {
  if (hasEmptyTail && index >= config.frames) return 'Image vide';
  return `Image ${index + 1}`;
}

/** Orientation alignée sur le côté le plus long de l'image. */
function detectOrientationFromSize(width, height) {
  if (width > height) return 'horizontal';
  return 'vertical';
}

function IconEyedropper() {
  return (
    <svg
      className="sprite-player__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m17 3-1.5 1.5" />
      <path d="M5 19l2-7.5L17 1.5l4.5 4.5L9.5 21z" />
      <path d="M5 19 2 22" />
    </svg>
  );
}

function IconTransparent() {
  return (
    <svg className="sprite-player__icon" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3" width="8" height="8" fill="currentColor" opacity="0.35" />
      <rect x="13" y="3" width="8" height="8" fill="currentColor" opacity="0.55" />
      <rect x="3" y="13" width="8" height="8" fill="currentColor" opacity="0.55" />
      <rect x="13" y="13" width="8" height="8" fill="currentColor" opacity="0.35" />
      <path
        d="M4 4l16 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTransportStart() {
  return (
    <svg className="sprite-player__transport-icon" viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="6" width="2" height="12" fill="currentColor" />
      <path d="M17 6L11 12l6 6V6z" fill="currentColor" />
      <path d="M13 6L7 12l6 6V6z" fill="currentColor" />
    </svg>
  );
}

function IconTransportPrev() {
  return (
    <svg className="sprite-player__transport-icon" viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="6" width="2" height="12" fill="currentColor" />
      <path d="M17 6L11 12l6 6V6z" fill="currentColor" />
    </svg>
  );
}

function IconTransportPlay() {
  return (
    <svg className="sprite-player__transport-icon" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 6l10 6-10 6V6z" fill="currentColor" />
    </svg>
  );
}

function IconTransportPause() {
  return (
    <svg className="sprite-player__transport-icon" viewBox="0 0 24 24" aria-hidden>
      <rect x="7" y="6" width="3.5" height="12" fill="currentColor" />
      <rect x="13.5" y="6" width="3.5" height="12" fill="currentColor" />
    </svg>
  );
}

function IconTransportNext() {
  return (
    <svg className="sprite-player__transport-icon" viewBox="0 0 24 24" aria-hidden>
      <path d="M7 6l6 6-6 6V6z" fill="currentColor" />
      <rect x="17" y="6" width="2" height="12" fill="currentColor" />
    </svg>
  );
}

function IconTransportEnd() {
  return (
    <svg className="sprite-player__transport-icon" viewBox="0 0 24 24" aria-hidden>
      <path d="M7 6l6 6-6 6V6z" fill="currentColor" />
      <path d="M11 6l6 6-6 6V6z" fill="currentColor" />
      <rect x="17" y="6" width="2" height="12" fill="currentColor" />
    </svg>
  );
}

/**
 * Lecteur de sprite sheet en boucle (style GIF), sans backend.
 */
export default function SpritePlayer() {
  const [imageSrc, setImageSrc] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [orientation, setOrientation] = useState('vertical');
  const [framesInput, setFramesInput] = useState('8');
  const [fps, setFps] = useState(12);
  const [config, setConfig] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [appendEmptyFrame, setAppendEmptyFrame] = useState(false);
  const [emptyFrameUseBgColor, setEmptyFrameUseBgColor] = useState(false);
  const [emptyFrameBgColor, setEmptyFrameBgColor] = useState('#000000');
  const [frameFpsOverrides, setFrameFpsOverrides] = useState({});
  const [error, setError] = useState('');
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef(null);

  const loadImageFile = useCallback((file) => {
    if (!isImageFile(file)) {
      setError('Format non pris en charge. Utilisez un PNG ou JPEG.');
      return;
    }
    setError('');
    setConfig(null);
    setFrameIndex(0);
    setIsPaused(false);
    setFrameFpsOverrides({});
    setEmptyFrameUseBgColor(false);
    setEmptyFrameBgColor('#000000');
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

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) loadImageFile(file);
      e.target.value = '';
    },
    [loadImageFile]
  );

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadImageFile(file);
    },
    [loadImageFile]
  );

  const handleImageLoad = useCallback((e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize({ w: naturalWidth, h: naturalHeight });
    setOrientation(detectOrientationFromSize(naturalWidth, naturalHeight));
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
    setFrameFpsOverrides({});
  }, [imageSrc, naturalSize, framesInput, orientation]);

  const playbackFrameCount = config
    ? config.frames + (appendEmptyFrame ? 1 : 0)
    : 0;

  const isEmptyFrame =
    Boolean(config) && appendEmptyFrame && frameIndex >= config.frames;

  const goPrevFrame = useCallback(() => {
    if (!config || playbackFrameCount === 0) return;
    setFrameIndex((i) => (i - 1 + playbackFrameCount) % playbackFrameCount);
  }, [config, playbackFrameCount]);

  const goNextFrame = useCallback(() => {
    if (!config || playbackFrameCount === 0) return;
    setFrameIndex((i) => (i + 1) % playbackFrameCount);
  }, [config, playbackFrameCount]);

  const handleAppendEmptyFrameChange = useCallback(
    (e) => {
      const checked = e.target.checked;
      setAppendEmptyFrame(checked);
      if (!checked && config) {
        if (frameIndex >= config.frames) {
          setFrameIndex(config.frames - 1);
        }
        setFrameFpsOverrides((prev) => {
          const next = { ...prev };
          delete next[config.frames];
          return next;
        });
      }
    },
    [config, frameIndex]
  );

  const goToStart = useCallback(() => {
    setFrameIndex(0);
  }, []);

  const goToEnd = useCallback(() => {
    if (!config || playbackFrameCount === 0) return;
    setFrameIndex(playbackFrameCount - 1);
  }, [config, playbackFrameCount]);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const getEffectiveFrameFps = useCallback(
    (index) => frameFpsOverrides[index] ?? fps,
    [frameFpsOverrides, fps]
  );

  const currentFrameFps = getEffectiveFrameFps(frameIndex);

  const handleFrameFpsOverrideChange = useCallback(
    (e) => {
      const value = Number(e.target.value);
      setFrameFpsOverrides((prev) => {
        const next = { ...prev };
        if (value === fps) {
          delete next[frameIndex];
        } else {
          next[frameIndex] = value;
        }
        return next;
      });
    },
    [frameIndex, fps]
  );

  const resetAllFrameFpsOverrides = useCallback(() => {
    setFrameFpsOverrides({});
  }, []);

  const goToFrameAndPause = useCallback((index) => {
    setFrameIndex(index);
    setIsPaused(true);
  }, []);

  const overrideEntries = useMemo(() => {
    if (!config) return [];
    return Object.entries(frameFpsOverrides)
      .map(([key, overrideFps]) => ({
        index: Number(key),
        fps: overrideFps,
      }))
      .filter(
        (entry) =>
          Number.isFinite(entry.index) &&
          entry.index >= 0 &&
          entry.index < playbackFrameCount
      )
      .sort((a, b) => a.index - b.index);
  }, [frameFpsOverrides, config, playbackFrameCount]);

  useEffect(() => {
    if (!config || isPaused || playbackFrameCount === 0) return;

    const delayMs = 1000 / getEffectiveFrameFps(frameIndex);
    const id = window.setTimeout(() => {
      setFrameIndex((i) => (i + 1) % playbackFrameCount);
    }, delayMs);

    return () => window.clearTimeout(id);
  }, [
    frameIndex,
    fps,
    frameFpsOverrides,
    config,
    isPaused,
    playbackFrameCount,
    getEffectiveFrameFps,
  ]);

  const backgroundPosition = useMemo(() => {
    if (!config || isEmptyFrame) return '0 0';
    if (config.orientation === 'horizontal') {
      return `${-(frameIndex * config.frameW)}px 0`;
    }
    return `0 ${-(frameIndex * config.frameH)}px`;
  }, [config, frameIndex, isEmptyFrame]);

  const frameBoxStyle = useMemo(() => {
    if (!config) return undefined;
    return {
      width: `${config.frameW}px`,
      height: `${config.frameH}px`,
    };
  }, [config]);

  const emptyFrameStyle = useMemo(() => {
    if (!frameBoxStyle) return undefined;
    if (!emptyFrameUseBgColor) return frameBoxStyle;
    return {
      ...frameBoxStyle,
      backgroundColor: emptyFrameBgColor,
    };
  }, [frameBoxStyle, emptyFrameUseBgColor, emptyFrameBgColor]);

  const handleEmptyFrameBgColorChange = useCallback((e) => {
    setEmptyFrameBgColor(e.target.value);
    setEmptyFrameUseBgColor(true);
  }, []);

  const handleEmptyFrameEyedropper = useCallback(async () => {
    if (!window.EyeDropper) {
      setError('La pipette n’est pas prise en charge par ce navigateur (Chrome ou Edge recommandé).');
      return;
    }
    try {
      const dropper = new window.EyeDropper();
      const { sRGBHex } = await dropper.open();
      setEmptyFrameBgColor(sRGBHex);
      setEmptyFrameUseBgColor(true);
      setError('');
    } catch {
      /* annulation par l’utilisateur */
    }
  }, []);

  const previewStyle = useMemo(() => {
    if (!imageSrc || !config || isEmptyFrame) return undefined;
    return {
      ...frameBoxStyle,
      backgroundImage: `url(${imageSrc})`,
      backgroundSize: `${config.fullW}px ${config.fullH}px`,
      backgroundPosition,
      backgroundRepeat: 'no-repeat',
    };
  }, [imageSrc, config, isEmptyFrame, frameBoxStyle, backgroundPosition]);

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
          <div
            className={`sprite-player__dropzone${isDragging ? ' sprite-player__dropzone--active' : ''}${imageSrc ? ' sprite-player__dropzone--has-image' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Zone de dépôt : glissez une image PNG ou JPEG, ou appuyez pour parcourir"
          >
            <p className="sprite-player__dropzone-text">
              {isDragging
                ? 'Relâchez pour importer'
                : 'Glissez une image ici'}
            </p>
            <p className="sprite-player__dropzone-hint">PNG ou JPEG</p>
            <button
              type="button"
              className="sprite-player__file-btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Parcourir…
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              className="sprite-player__file-input"
              onChange={handleFileChange}
              tabIndex={-1}
              aria-hidden
            />
          </div>
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
          <label className="sprite-player__checkbox">
            <input
              type="checkbox"
              checked={appendEmptyFrame}
              onChange={handleAppendEmptyFrameChange}
              disabled={!config}
            />
            <span>Image vide en fin d&apos;animation</span>
          </label>
          {appendEmptyFrame && (
            <div className="sprite-player__empty-bg">
              <label className="sprite-player__checkbox sprite-player__checkbox--nested">
                <input
                  type="checkbox"
                  checked={emptyFrameUseBgColor}
                  onChange={(e) => setEmptyFrameUseBgColor(e.target.checked)}
                />
                <span>Couleur de fond personnalisée</span>
              </label>
              <div className="sprite-player__color-row">
              <input
                type="color"
                value={emptyFrameBgColor}
                onChange={handleEmptyFrameBgColorChange}
                className="sprite-player__color-input"
                disabled={!emptyFrameUseBgColor}
                aria-label="Couleur de fond de l’image vide"
              />
              <button
                type="button"
                className="sprite-player__btn sprite-player__btn--secondary sprite-player__btn--icon"
                onClick={handleEmptyFrameEyedropper}
                disabled={!emptyFrameUseBgColor}
                title="Pipette : prélever une couleur à l’écran"
                aria-label="Pipette : prélever une couleur à l’écran"
              >
                <IconEyedropper />
              </button>
              <button
                type="button"
                className="sprite-player__btn sprite-player__btn--secondary sprite-player__btn--icon"
                onClick={() => setEmptyFrameUseBgColor(false)}
                disabled={!emptyFrameUseBgColor}
                title="Fond transparent"
                aria-label="Fond transparent"
              >
                <IconTransparent />
              </button>
            </div>
            </div>
          )}
        </section>
      </div>

      {error && <p className="sprite-player__error" role="alert">{error}</p>}

      <section className="sprite-player__preview-wrap" aria-label="Aperçu animation">
        <div className="sprite-player__preview">
          {config && frameBoxStyle ? (
            isEmptyFrame ? (
              <div
                className="sprite-player__sprite sprite-player__sprite--empty"
                style={emptyFrameStyle}
                aria-label="Image vide"
              />
            ) : (
              <div className="sprite-player__sprite" style={previewStyle} />
            )
          ) : (
            <p className="sprite-player__placeholder">
              {imageSrc
                ? 'Configurez les frames puis cliquez sur « Valider & Lancer ».'
                : 'Glissez une image ou importez-la depuis le panneau Image.'}
            </p>
          )}
        </div>
        {config && (
          <div className="sprite-player__transport" role="toolbar" aria-label="Contrôles de lecture">
            <div className="sprite-player__transport-status">
              <span className="sprite-player__frame-badge" aria-live="polite">
                {isEmptyFrame
                  ? `Vide · ${playbackFrameCount} / ${playbackFrameCount}`
                  : `Image ${frameIndex + 1} / ${playbackFrameCount}`}
                {isPaused ? ' · en pause' : ''}
              </span>
              {isPaused && (
                <label className="sprite-player__frame-fps-override">
                  <span className="sprite-player__frame-fps-override-label">
                    FPS image :{' '}
                    <strong className="sprite-player__fps-value">{currentFrameFps}</strong>
                  </span>
                  <input
                    type="range"
                    min={FRAME_FPS_OVERRIDE_MIN}
                    max={FRAME_FPS_OVERRIDE_MAX}
                    step={1}
                    value={currentFrameFps}
                    onChange={handleFrameFpsOverrideChange}
                    className="sprite-player__range sprite-player__range--compact"
                    aria-label={`FPS de ${getFrameLabel(frameIndex, config, appendEmptyFrame)}`}
                  />
                </label>
              )}
            </div>
            <div className="sprite-player__transport-bar">
              <button
                type="button"
                className="sprite-player__transport-btn"
                onClick={goToStart}
                title="Première image"
                aria-label="Première image"
              >
                <IconTransportStart />
              </button>
              <button
                type="button"
                className="sprite-player__transport-btn"
                onClick={goPrevFrame}
                title="Image précédente"
                aria-label="Image précédente"
              >
                <IconTransportPrev />
              </button>
              <button
                type="button"
                className="sprite-player__transport-btn sprite-player__transport-btn--play"
                onClick={togglePause}
                aria-pressed={!isPaused}
                title={isPaused ? 'Lecture' : 'Pause'}
                aria-label={isPaused ? 'Lecture' : 'Pause'}
              >
                {isPaused ? <IconTransportPlay /> : <IconTransportPause />}
              </button>
              <button
                type="button"
                className="sprite-player__transport-btn"
                onClick={goNextFrame}
                title="Image suivante"
                aria-label="Image suivante"
              >
                <IconTransportNext />
              </button>
              <button
                type="button"
                className="sprite-player__transport-btn"
                onClick={goToEnd}
                title="Dernière image"
                aria-label="Dernière image"
              >
                <IconTransportEnd />
              </button>
            </div>
          </div>
        )}
      </section>

      {config && overrideEntries.length > 0 && (
        <section
          className="sprite-player__overrides"
          aria-label="Surcharges FPS par image"
        >
          <h2 className="sprite-player__overrides-title">Surcharges FPS</h2>
          <ul className="sprite-player__overrides-list">
            {overrideEntries.map(({ index, fps: overrideFps }) => (
              <li key={index}>
                <button
                  type="button"
                  className={`sprite-player__overrides-item${frameIndex === index && isPaused ? ' sprite-player__overrides-item--active' : ''}`}
                  onClick={() => goToFrameAndPause(index)}
                  title={`Afficher ${getFrameLabel(index, config, appendEmptyFrame)} et mettre en pause`}
                >
                  <span className="sprite-player__overrides-name">
                    {getFrameLabel(index, config, appendEmptyFrame)}
                  </span>
                  <span className="sprite-player__overrides-value">{overrideFps} FPS</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="sprite-player__btn sprite-player__btn--secondary sprite-player__btn--reset-overrides"
            onClick={resetAllFrameFpsOverrides}
          >
            Réinitialiser toutes les surcharges
          </button>
        </section>
      )}

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
