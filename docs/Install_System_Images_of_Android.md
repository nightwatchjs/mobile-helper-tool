
##   
Install system-images of additional Android versions

**1. Listing Available SDK Packages:**

```
sdkmanager --list

```

This command displays all available SDK packages you can install or update.

**2. Installing System Images:**

```
sdkmanager --install "system-images;android-30;google_apis;x86_64"

```

This command installs the system image for Android 30 with Google APIs for the x86_64 architecture. Replace `android-30` with your desired version.

**3. Creating an Emulator:**

```
avdmanager create avd -n <name> -k "system-images;android-30;google_apis;x86_64"

```

This command creates an emulator named `<name>` and uses the system image for Android 30 with Google APIs for the x86_64 architecture.

**4. Starting an Emulator:**

```
emulator -avd <name>

```

This command starts the emulator named `<name>`.

**5. Listing Created Emulators:**

```
emulator -list-avds

```

This command displays all the emulators you have created.

**6. Updating SDK Packages:**

```
sdkmanager --update

```

This command updates all installed SDK packages to their latest versions.

**7. Installing Additional SDK Packages:**

```
sdkmanager --install "extras;google;google_play_services"

```

This command installs additional SDK packages, such as Google Play services.

**8. Deleting an Emulator:**

```
avdmanager delete avd -n <name>

```

This command deletes the emulator named `<name>`.

Remember to replace `<name>` with the actual name of your emulator in the commands requiring it. 