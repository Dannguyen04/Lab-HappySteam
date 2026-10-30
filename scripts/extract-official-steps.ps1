# Requires the PDF pages to be rendered to assets/official-assembly/source-NN.jpg.
# Crop only the left/right visual panels. No instructions or pieces are redrawn.
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$folder = Join-Path $root 'assets/official-assembly'
$mapping = @(
    @{ Page = 2; Steps = @(1,2) }, @{ Page = 3; Steps = @(3,4) },
    @{ Page = 4; Steps = @(5,6) }, @{ Page = 5; Steps = @(7,8) },
    @{ Page = 6; Steps = @(9) },   @{ Page = 7; Steps = @(10,11) },
    @{ Page = 8; Steps = @(12,13) }, @{ Page = 9; Steps = @(14,15) },
    @{ Page = 10; Steps = @(16,17) }, @{ Page = 11; Steps = @(18,19) },
    @{ Page = 12; Steps = @(21,22) }, @{ Page = 13; Steps = @(23,24) },
    @{ Page = 14; Steps = @(25,26) }, @{ Page = 15; Steps = @(27,28) }
)
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]91)
foreach ($item in $mapping) {
    $source = Join-Path $folder ('source-{0:00}.jpg' -f $item.Page)
    $bitmap = [System.Drawing.Bitmap]::FromFile($source)
    try {
        for ($index = 0; $index -lt $item.Steps.Count; $index++) {
            $width = if ($item.Steps.Count -eq 1) { $bitmap.Width } else { [int][Math]::Ceiling($bitmap.Width / 2) }
            $x = if ($index -eq 0) { 0 } else { $bitmap.Width - $width }
            $y = [int][Math]::Floor($bitmap.Height * 0.12)
            $height = [int][Math]::Ceiling($bitmap.Height * 0.78)
            $rect = New-Object System.Drawing.Rectangle($x, $y, $width, $height)
            $piece = $bitmap.Clone($rect, $bitmap.PixelFormat)
            try {
                $target = Join-Path $folder ('step-{0:00}.jpg' -f $item.Steps[$index])
                $piece.Save($target, $jpeg, $params)
                Write-Output $target
            } finally { $piece.Dispose() }
        }
    } finally { $bitmap.Dispose() }
}
$params.Dispose()
