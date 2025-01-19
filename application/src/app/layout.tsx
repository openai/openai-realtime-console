import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Salience',
    description: 'Teach yourself to speak in any language'
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html>
            <body>
                <div id="root">{children}</div>
            </body>
        </html>

    )
}