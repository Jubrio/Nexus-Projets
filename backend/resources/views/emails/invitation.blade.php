@component('mail::message')
# Vous êtes invité(e) !

**{{ $inviterName }}** vous invite à rejoindre l'organisation **{{ $organizationName }}** sur NEXUS, avec le rôle **{{ $roleName }}**.

@component('mail::button', ['url' => $acceptUrl])
Accepter l'invitation
@endcomponent

Ce lien expire dans 7 jours. Si vous ne vous attendiez pas à cette invitation, vous pouvez ignorer cet email en toute sécurité.

Cordialement,<br>
NEXUS
@endcomponent
