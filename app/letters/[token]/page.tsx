import { redirect } from 'next/navigation'

export default function LetterRedirectPage({ params }: { params: { token: string } }) {
  redirect(`/lettre/${params.token}`)
}
