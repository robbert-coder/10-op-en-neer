package nl.tienopenneer.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.TextUnit
import nl.tienopenneer.engine.Card

const val CARD_RATIO = 1.4f

/** Een kaart met de beeldzijde boven. */
@Composable
fun CardFace(
    card: Card,
    width: Dp,
    modifier: Modifier = Modifier,
    dimmed: Boolean = false,
    highlight: Color? = null,
) {
    val shape = RoundedCornerShape(width * 0.1f)
    val ink = if (Card.isRed(card.suit)) CardRed else CardBlack
    val base = width.value
    val density = LocalDensity.current
    // Lettergrootte in verhouding tot de kaart, los van de tekstgrootte-instelling van het toestel
    fun ts(f: Float): TextUnit = with(density) { (base * f).dp.toSp() }
    Box(
        modifier
            .size(width, width * CARD_RATIO)
            .clip(shape)
            .background(if (dimmed) Color(0xFFBDBDBD) else Color.White)
            .border(
                width = if (highlight != null) 3.dp else 1.dp,
                color = highlight ?: Color(0xFF424242),
                shape = shape,
            ),
    ) {
        Column(
            Modifier
                .align(Alignment.TopStart)
                .padding(start = (base * 0.07f).dp, top = (base * 0.03f).dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                Card.rankLabel(card.rank),
                color = ink,
                fontWeight = FontWeight.Bold,
                fontSize = ts(0.30f),
                lineHeight = ts(0.32f),
            )
            Text(
                Card.suitSymbol(card.suit),
                color = ink,
                fontSize = ts(0.26f),
                lineHeight = ts(0.28f),
            )
        }
        Text(
            Card.suitSymbol(card.suit),
            color = ink,
            fontSize = ts(0.55f),
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = (base * 0.08f).dp, bottom = (base * 0.04f).dp),
        )
    }
}

/** De achterkant van een kaart. */
@Composable
fun CardBack(width: Dp, modifier: Modifier = Modifier) {
    val shape = RoundedCornerShape(width * 0.1f)
    Box(
        modifier
            .size(width, width * CARD_RATIO)
            .clip(shape)
            .background(Color.White)
            .border(1.dp, Color(0xFF424242), shape)
            .padding(width * 0.07f)
            .clip(RoundedCornerShape(width * 0.06f))
            .background(Color(0xFF1E4FA0)),
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val step = size.width / 5f
            var x = -size.height
            while (x < size.width + size.height) {
                drawLine(Color(0x553D7BE0), Offset(x, 0f), Offset(x + size.height, size.height), strokeWidth = 2f)
                drawLine(Color(0x553D7BE0), Offset(x + size.height, 0f), Offset(x, size.height), strokeWidth = 2f)
                x += step
            }
        }
    }
}

/** Lege plek waar een kaart kan komen. */
@Composable
fun CardSlot(width: Dp, modifier: Modifier = Modifier) {
    val shape = RoundedCornerShape(width * 0.1f)
    Box(
        modifier
            .size(width, width * CARD_RATIO)
            .border(1.dp, Color(0x33FFFFFF), shape),
    )
}
