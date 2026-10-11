plugins {
    id("org.jetbrains.kotlin.multiplatform")
}

kotlin {
    js {
        moduleName = "tienopenneer"
        browser()
        useEsModules()
        binaries.library()
    }
    sourceSets {
        // De spelregels en computerspelers komen uit dezelfde bron als de Android-app
        commonMain {
            kotlin.srcDir("../engine/src/main/kotlin")
        }
    }
}

/** De complete website: de pagina's uit static/ plus de omgezette spelcode. */
val site by tasks.registering(Sync::class) {
    val compile = tasks.named("compileProductionLibraryKotlinJs")
    dependsOn(compile)
    from(layout.buildDirectory.dir("compileSync/js/main/productionLibrary/kotlin")) {
        include("*.mjs")
    }
    from("static")
    val build = System.currentTimeMillis().toString()
    inputs.property("build", build)
    filesMatching("sw.js") {
        filter { line -> line.replace("__BUILD__", build) }
    }
    into(layout.buildDirectory.dir("site"))
}
