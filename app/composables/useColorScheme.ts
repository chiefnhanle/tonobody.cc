import { DEFAULT_THEME_ID, findTheme } from '~/utils/themes'

/** Shared, session-only color scheme selection — resets on reload, never persisted. */
export function useColorScheme() {
  const themeId = useState<string>('tv-theme-id', () => DEFAULT_THEME_ID)
  const theme = computed(() => findTheme(themeId.value))

  function setTheme(id: string) {
    themeId.value = id
  }

  return { themeId, theme, setTheme }
}
