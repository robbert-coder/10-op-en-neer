plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "nl.tienopenneer.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "nl.tienopenneer.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 41
        versionName = "2.39"
    }

    // Vaste ondertekensleutel uit de GitHub-geheimen (SIGNING_KEY), zodat een nieuwe versie over de oude heen
    // installeert. Zonder die sleutel (lokaal, pull requests) gewoon de debugsleutel.
    val keyFile = System.getenv("SIGNING_KEYSTORE")?.let { file(it) }?.takeIf { it.exists() }
    if (keyFile != null) {
        signingConfigs {
            create("vast") {
                storeFile = keyFile
                storeType = "PKCS12"
                storePassword = "tienopenneer"
                keyAlias = "tienopenneer"
                keyPassword = "tienopenneer"
            }
        }
    }

    buildTypes {
        debug {
            if (keyFile != null) signingConfig = signingConfigs.getByName("vast")
        }
        // De uitgebrachte APK is een release-build: niet te debuggen, dus de WebView en de opslag zijn
        // niet van buitenaf te bekijken. Zonder vaste sleutel (lokaal) met de debugsleutel ondertekend.
        release {
            isMinifyEnabled = false
            signingConfig = if (keyFile != null) signingConfigs.getByName("vast") else signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // De lint-controle bij een release-build vraagt Android-hulpmiddelen die in de bouwstraat niet nodig zijn
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    sourceSets["main"].assets.srcDir(layout.buildDirectory.dir("generated/webassets"))
}

/**
 * De app toont dezelfde website als de webversie, meegeleverd in de app zelf. Zo hebben beide
 * precies dezelfde mogelijkheden en kunnen ze samen aan één tafel spelen en chatten.
 */
val webAssets by tasks.registering(Sync::class) {
    dependsOn(":web:site")
    from(rootProject.layout.projectDirectory.dir("web/build/site")) {
        exclude("sw.js")
    }
    into(layout.buildDirectory.dir("generated/webassets/web"))
}

tasks.named("preBuild") { dependsOn(webAssets) }

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.work:work-runtime-ktx:2.9.1")
}
