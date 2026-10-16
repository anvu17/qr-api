# An Vu QR

Lightweight and fast QR code generation API.

## API

### GET
```text
https://<domain>/?text=https://example.com
```

### Parameters

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `text` | required | Content or URL to encode |
| `color` | `000000` | Hex foreground color |
| `bg` | `ffffff` | Hex or transparent background |
| `ecc` | `M` | Error correction level (`L`, `M`, `Q`, `H`) |
| `margin` | `2` | Border width from `0` to `10` |
| `download` | - | Download as SVG attachment |

### POST
```bash
curl -X POST "https://<domain>/" \
  -H "Content-Type: application/json" \
  -d '{"text": "https://example.com", "color": "2563eb"}'
```
