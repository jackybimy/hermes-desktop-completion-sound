import { host, ListRow, icons } from '@hermes/plugin-sdk'
import { useState } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

const DATA_KEY = 'audioDataUrl'
const NAME_KEY = 'audioFileName'
const VOLUME_KEY = 'volume'
const MAX_BYTES = 1.5 * 1024 * 1024

function clampVolume(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(1, Math.max(0, n))
}

function playSound(url, volume, showError = false) {
  if (!url) return

  const audio = new Audio(url)
  audio.volume = clampVolume(volume)

  audio.play().catch((error) => {
    console.warn('[custom-completion-sound] Playback failed:', error)

    if (showError) {
      host.notifyError(
        error,
        'Не удалось воспроизвести звук. Попробуй другой аудиофайл.'
      )
    }
  })
}

// The one range control, styled like the app's own Slider: hairline track in
// the stroke tint, native thumb in the primary accent.
function VolumeSlider({ value, onChange }) {
  return jsx('input', {
    type: 'range',
    min: 0,
    max: 100,
    step: 5,
    value: Math.round(value * 100),
    onChange: (event) => onChange(clampVolume(event.currentTarget.value) / 100),
    className:
      'h-1 w-40 cursor-pointer appearance-none rounded-full bg-(--ui-stroke-tertiary)',
    style: { accentColor: 'var(--dt-primary)' },
    'aria-label': 'Громкость'
  })
}

function Settings({ ctx }) {
  const [audioUrl, setAudioUrl] = useState(ctx.storage.get(DATA_KEY, ''))
  const [fileName, setFileName] = useState(ctx.storage.get(NAME_KEY, ''))
  const [volume, setVolume] = useState(clampVolume(ctx.storage.get(VOLUME_KEY, 1)))
  const [message, setMessage] = useState('')

  function handleFileChange(event) {
    const file = event.currentTarget?.files?.[0]
    if (!file) return

    if (file.size > MAX_BYTES) {
      setMessage('Файл слишком большой. Максимум 1.5 МБ.')
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    const mimeByExt = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      flac: 'audio/flac'
    }
    const mime = file.type.startsWith('audio/')
      ? file.type
      : mimeByExt[ext]

    if (!mime) {
      setMessage('Поддерживаются MP3, WAV, OGG, M4A и FLAC.')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const raw = String(reader.result || '')
      const comma = raw.indexOf(',')

      if (comma < 0) {
        setMessage('Не удалось прочитать файл.')
        return
      }

      const dataUrl = `data:${mime};base64,${raw.slice(comma + 1)}`

      ctx.storage.set(DATA_KEY, dataUrl)
      ctx.storage.set(NAME_KEY, file.name)

      setAudioUrl(dataUrl)
      setFileName(file.name)
      setMessage('Звук сохранён.')
    }

    reader.onerror = () => {
      setMessage('Не удалось прочитать файл.')
    }

    reader.readAsDataURL(file)
  }

  function removeSound() {
    ctx.storage.remove(DATA_KEY)
    ctx.storage.remove(NAME_KEY)
    setAudioUrl('')
    setFileName('')
    setMessage('Свой звук удалён.')
  }

  function handleVolumeChange(next) {
    setVolume(next)
    ctx.storage.set(VOLUME_KEY, next)
    setMessage('')
  }

  function preview() {
    setMessage('')
    playSound(audioUrl, volume, true)
  }

  const fileRow = jsx(ListRow, {
    title: 'Аудиофайл',
    description: audioUrl
      ? `Выбран: ${fileName}`
      : 'Свой звук ещё не выбран. Поддерживаются MP3, WAV, OGG, M4A и FLAC до 1.5 МБ.',
    action: jsx('label', {
      className:
        'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[2.5px] bg-(--ui-bg-quaternary) px-2.5 text-xs leading-4 font-medium whitespace-nowrap text-(--ui-text-primary) transition-all duration-100 hover:bg-(--chrome-action-hover) hover:text-(--ui-text-primary)',
      children: [
        jsx(icons.Play, { className: 'size-3.5' }),
        'Выбрать файл',
        jsx('input', {
          type: 'file',
          accept: '.mp3,.wav,.ogg,.m4a,.flac,audio/*',
          onChange: handleFileChange,
          className: 'hidden'
        })
      ]
    })
  })

  const volumeRow = jsx(ListRow, {
    title: 'Громкость',
    description: 'Относительно громкости системы. Действует и на предпросмотр.',
    action: jsxs('div', {
      className: 'flex items-center gap-2.5',
      children: [
        jsx(icons.VolumeX, { className: 'size-3.5 shrink-0 text-(--ui-text-tertiary)' }),
        jsx(VolumeSlider, { value: volume, onChange: handleVolumeChange }),
        jsx(icons.Volume2, { className: 'size-3.5 shrink-0 text-(--ui-text-tertiary)' }),
        jsx('span', {
          className:
            'w-9 text-right font-mono text-[0.68rem] text-(--ui-text-tertiary)',
          children: `${Math.round(volume * 100)}%`
        })
      ]
    })
  })

  const actionsRow = jsxs('div', {
    className: 'flex flex-wrap items-center gap-2 py-3',
    children: [
      jsx('button', {
        type: 'button',
        disabled: !audioUrl,
        onClick: preview,
        className:
          'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[2.5px] bg-primary px-2.5 text-xs leading-4 font-medium whitespace-nowrap text-primary-foreground transition-all duration-100 hover:bg-primary/90 disabled:pointer-events-none disabled:cursor-default disabled:opacity-50',
        children: [
          jsx(icons.Play, { className: 'size-3.5' }),
          'Прослушать'
        ]
      }),
      jsx('button', {
        type: 'button',
        disabled: !audioUrl,
        onClick: removeSound,
        className:
          'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[2.5px] bg-(--ui-bg-quaternary) px-2.5 text-xs leading-4 font-medium whitespace-nowrap text-(--ui-text-primary) transition-all duration-100 hover:bg-(--chrome-action-hover) hover:text-(--ui-text-primary) disabled:pointer-events-none disabled:cursor-default disabled:opacity-50',
        children: [
          jsx(icons.VolumeX, { className: 'size-3.5' }),
          'Удалить звук'
        ]
      })
    ]
  })

  return jsxs('div', {
    className: 'flex flex-col',
    children: [
      fileRow,
      jsx('div', { className: 'border-t border-(--ui-stroke-secondary)' }),
      volumeRow,
      jsx('div', { className: 'border-t border-(--ui-stroke-secondary)' }),
      actionsRow,
      message
        ? jsx('div', {
            className: 'pb-3 text-(--ui-text-tertiary)',
            children: message
          })
        : null
    ]
  })
}

export default {
  id: 'custom-completion-sound',
  name: 'Custom Completion Sound',
  defaultEnabled: true,

  register(ctx) {
    ctx.registerSettingsPage?.({
      id: 'settings',
      title: 'Completion Sound',
      render: () => jsx(Settings, { ctx })
    })

    ctx.onEvent('message.complete', () => {
      const url = ctx.storage.get(DATA_KEY, '')

      if (typeof url === 'string' && url.startsWith('data:audio/')) {
        playSound(url, ctx.storage.get(VOLUME_KEY, 1))
      }
    })
  }
}
