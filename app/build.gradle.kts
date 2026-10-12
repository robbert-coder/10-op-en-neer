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
        versionCode = 9
        versionName = "2.7"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
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
}
