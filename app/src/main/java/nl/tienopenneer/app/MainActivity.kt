package nl.tienopenneer.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import nl.tienopenneer.app.ui.GameScreen
import nl.tienopenneer.app.ui.HighScoresScreen
import nl.tienopenneer.app.ui.MenuScreen
import nl.tienopenneer.app.ui.NewGameScreen
import nl.tienopenneer.app.ui.RulesScreen
import nl.tienopenneer.app.ui.SettingsScreen
import nl.tienopenneer.app.ui.TienOpEnNeerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            TienOpEnNeerTheme {
                App()
            }
        }
    }
}

@Composable
private fun App(vm: GameViewModel = viewModel()) {
    when (vm.screen) {
        Screen.MENU -> MenuScreen(vm)
        Screen.NEW_GAME -> NewGameScreen(vm)
        Screen.GAME -> GameScreen(vm)
        Screen.RULES -> RulesScreen(vm)
        Screen.HIGHSCORES -> HighScoresScreen(vm)
        Screen.SETTINGS -> SettingsScreen(vm)
    }
}
