package ai.Durar.app.ui

import androidx.compose.runtime.Composable
import ai.Durar.app.MainViewModel
import ai.Durar.app.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
