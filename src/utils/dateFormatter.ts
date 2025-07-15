import { DateTime } from 'luxon'

export function formatToShortDate(isoString: string, locale: string = 'fr') {
    return DateTime.fromISO(isoString)
        .setLocale(locale)
        .toLocaleString(DateTime.DATE_SHORT)
}

export function formatToShortDateAndTime(
    isoString: string,
    locale: string = 'fr'
) {
    return DateTime.fromISO(isoString)
        .setLocale(locale)
        .toLocaleString(DateTime.DATETIME_SHORT)
}
