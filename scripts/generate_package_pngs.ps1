$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$root = Join-Path $workspaceRoot "frontend\public\package-png"
New-Item -ItemType Directory -Force -Path $root | Out-Null

function New-Brush($color) {
  return New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
}

function Draw-Diamond($g, $points, $fillColor, $outlineColor) {
  $fill = New-Brush $fillColor
  $outline = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($outlineColor), 8)
  $g.FillPolygon($fill, $points)
  $g.DrawPolygon($outline, $points)
  $fill.Dispose()
  $outline.Dispose()
}

function Save-PackagePng(
  [string]$Path,
  [string]$Label,
  [string]$Accent,
  [string]$AccentLight,
  [string]$Shadow,
  [string]$Subtext
) {
  $bitmap = New-Object System.Drawing.Bitmap 512, 512
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $shadowBrush = New-Brush $Shadow
  $accentBrush = New-Brush $Accent
  $accentLightBrush = New-Brush $AccentLight
  $whiteBrush = New-Brush "#F8FAFC"
  $mutedBrush = New-Brush "#D4D4D8"

  $diamondShadow = @(
    (New-Object System.Drawing.PointF(256, 78)),
    (New-Object System.Drawing.PointF(392, 192)),
    (New-Object System.Drawing.PointF(336, 388)),
    (New-Object System.Drawing.PointF(176, 388)),
    (New-Object System.Drawing.PointF(120, 192))
  )
  $graphics.FillPolygon($shadowBrush, $diamondShadow)

  $diamondMain = @(
    (New-Object System.Drawing.PointF(256, 62)),
    (New-Object System.Drawing.PointF(404, 178)),
    (New-Object System.Drawing.PointF(340, 360)),
    (New-Object System.Drawing.PointF(172, 360)),
    (New-Object System.Drawing.PointF(108, 178))
  )
  Draw-Diamond $graphics $diamondMain $Accent "#FFFFFF"

  $diamondInner = @(
    (New-Object System.Drawing.PointF(256, 100)),
    (New-Object System.Drawing.PointF(360, 182)),
    (New-Object System.Drawing.PointF(318, 314)),
    (New-Object System.Drawing.PointF(194, 314)),
    (New-Object System.Drawing.PointF(152, 182))
  )
  Draw-Diamond $graphics $diamondInner $AccentLight "#FFFFFF"

  $facetPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 255, 255), 6)
  $graphics.DrawLine($facetPen, 256, 100, 256, 314)
  $graphics.DrawLine($facetPen, 152, 182, 360, 182)
  $graphics.DrawLine($facetPen, 152, 182, 256, 314)
  $graphics.DrawLine($facetPen, 360, 182, 256, 314)
  $facetPen.Dispose()

  $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 255, 255, 255))
  $graphics.FillEllipse($glowBrush, 126, 86, 78, 46)
  $graphics.FillEllipse($glowBrush, 228, 124, 52, 28)
  $glowBrush.Dispose()

  $labelFont = New-Object System.Drawing.Font("Arial", 34, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font("Arial", 19, [System.Drawing.FontStyle]::Bold)
  $smallFont = New-Object System.Drawing.Font("Arial", 17, [System.Drawing.FontStyle]::Bold)

  $labelRect = New-Object System.Drawing.RectangleF(40, 390, 432, 46)
  $subRect = New-Object System.Drawing.RectangleF(40, 436, 432, 28)
  $smallRect = New-Object System.Drawing.RectangleF(40, 464, 432, 24)

  $centerFormat = New-Object System.Drawing.StringFormat
  $centerFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $centerFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

  $graphics.DrawString($Label, $labelFont, $whiteBrush, $labelRect, $centerFormat)
  $graphics.DrawString($Subtext, $subFont, $accentLightBrush, $subRect, $centerFormat)
  $graphics.DrawString("PNG KHONG NEN", $smallFont, $mutedBrush, $smallRect, $centerFormat)

  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $centerFormat.Dispose()
  $labelFont.Dispose()
  $subFont.Dispose()
  $smallFont.Dispose()
  $shadowBrush.Dispose()
  $accentBrush.Dispose()
  $accentLightBrush.Dispose()
  $whiteBrush.Dispose()
  $mutedBrush.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

Save-PackagePng -Path (Join-Path $root "mlbb-diamond.png") -Label "MLBB" -Accent "#2563EB" -AccentLight "#67E8F9" -Shadow "#13233E" -Subtext "KIM CUONG"
Save-PackagePng -Path (Join-Path $root "mlbb-pass.png") -Label "MLBB" -Accent "#7C3AED" -AccentLight "#F9A8D4" -Shadow "#22113A" -Subtext "PASS / TUAN"
Save-PackagePng -Path (Join-Path $root "mcgg-diamond.png") -Label "MAGIC CHESS" -Accent "#7C3AED" -AccentLight "#FDE68A" -Shadow "#241541" -Subtext "KIM CUONG"
Save-PackagePng -Path (Join-Path $root "mcgg-pass.png") -Label "MAGIC CHESS" -Accent "#0F766E" -AccentLight "#A7F3D0" -Shadow "#16332F" -Subtext "VE TUAN"
