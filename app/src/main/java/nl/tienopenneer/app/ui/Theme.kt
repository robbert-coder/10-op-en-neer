package nl.tienopenneer.app.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Felt = Color(0xFF0E5A30)
val FeltDark = Color(0xFF0A4424)
val FeltLight = Color(0xFF1B7A45)
val Gold = Color(0xFFFFD54F)
val CardRed = Color(0xFFD32F2F)
val CardBlack = Color(0xFF212121)
val GoodGreen = Color(0xFF81C784)
val BadRed = Color(0xFFFF8A80)

private val colors = darkColorScheme(
    primary = Gold,
    onPrimary = Color(0xFF2B2100),
    secondary = Color(0xFFA5D6A7),
    background = Felt,
    onBackground = Color.White,
    surface = FeltDark,
    onSurface = Color.White,
    surfaceVariant = FeltLight,
    onSurfaceVariant = Color(0xFFE0E0E0),
    surfaceContainerHigh = FeltDark,
    surfaceContainer = FeltDark,
)

@Composable
fun TienOpEnNeerTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = colors, content = content)
}
