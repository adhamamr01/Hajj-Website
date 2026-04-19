// Minaret / arch silhouette used as a decorative divider in Hero (bottom edge)
// and Footer (top edge). Same path, different fill + opacity per context.
const ARCH_PATH = `
  <path d='M0 120 L0 90 L40 90 L40 60 Q40 50 50 50 L60 50 Q70 50 70 60 L70 90 L90 90 L90 70
           Q90 55 100 55 Q110 55 110 70 L110 90 L150 90 L150 70 Q150 40 180 40 Q210 40 210 70
           L210 90 L260 90 L260 55 Q260 30 290 30 Q320 30 320 55 L320 90 L370 90 L370 65
           Q370 45 400 45 Q430 45 430 65 L430 90 L470 90 L470 75 Q470 60 485 60 Q500 60 500 75
           L500 90 L540 90 L540 55 Q540 35 570 35 Q600 35 600 55 L600 120 Z'/>
  <circle cx='180' cy='30' r='6'/><path d='M180 10 L182 24 L178 24 Z'/>
  <circle cx='290' cy='20' r='7'/><path d='M290 0 L293 14 L287 14 Z'/>
  <circle cx='400' cy='35' r='5'/>
  <circle cx='570' cy='25' r='6'/><path d='M570 6 L572 20 L568 20 Z'/>
`

export function archSvgUrl(fill: string, opacity: number): string {
  return (
    `data:image/svg+xml,` +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 120' preserveAspectRatio='xMidYMax slice'>` +
      `<g fill='${fill}' opacity='${opacity}'>${ARCH_PATH}</g></svg>`,
    )
  )
}
