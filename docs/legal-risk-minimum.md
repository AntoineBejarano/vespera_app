# Protección legal mínima — Vesperer

**No es asesoría legal.** Reduce riesgo operativo; revisa con abogado antes de escalar.

## Qué hace hoy el código

| Control | Dónde |
|---------|--------|
| Bloqueo input/output (menores, grooming, explotación, coerción, indicadores CSAM) | `src/lib/ai/safety.ts` → chat, voz, memoria |
| Kill switch de emergencia | `SAFETY_KILL_SWITCH=true` en env |
| Transparencia IA (no negar ser bot si preguntan) | `assemble.ts`, `generator.ts` |
| Peers Telegram deben attestar 18+ (sin grandfather) | `src/lib/telegram/peers.ts` |
| 4 políticas legales + age gate | `src/lib/legal/` |
| Denuncias | `/report` → `ABUSE_EMAIL` |

## Capa plataforma vs operador (agencia)

| Vesperer (plataforma) | Agencia/creator (operador) |
|-----------------------|----------------------------|
| Infra, safety global, Terms, kill switch | Verificar 18+ de **su** audiencia |
| Age gate en vesperer.com | Aviso 18+ en **su** Telegram/canal |
| Bloqueo contenido ilegal | Cumplir Terms de Telegram/OF/etc. |
| `/report` y cooperación LE | Contenido y derechos del creator |

**Attestation:** checkbox único al conectar Telegram, crear API key, o publicar `/c/slug` (no bloquea bots/keys ya existentes).

**Terms §7:** B2B customers and channel operators.


**Deevly Labs LTD** — Company No. **16506991**  
Registered office: 128 City Road, London, EC1V 2NX, United Kingdom  
[Companies House](https://find-and-update.company-information.service.gov.uk/company/16506991)

## Qué NO cubre (riesgo residual)

- Verificación real de edad (ID/KYC)
- Audit log persistente
- Denuncias a autoridades automatizadas
- Integradores API que mienten en `endUserAgeAttested`

## Acciones recomendadas antes de escalar tráfico

1. Resolver entidad legal y emails en producción (`ABUSE_EMAIL`, counsel)
2. Revisar textos legales con abogado
3. Considerar proveedor age-verification en mercados regulados
4. Monitorizar logs `[safety_block]`
