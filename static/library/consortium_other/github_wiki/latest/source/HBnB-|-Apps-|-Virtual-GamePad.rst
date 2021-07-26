HBnB > Apps > Virtual-GamePad
======================================================
## Install Node.js

```
curl -sL https://deb.nodesource.com/setup_9.x | sudo bash -
sudo apt install -y build-essential python-dev nodejs npm
npm install -g npm
```
(Mines `node -v` = v14.13.0, `nodejs -v` = v10.21.0, `npm -v` = 6.14.8)

## You may also need development tools to build native addons:
```
sudo apt-get install gcc g++ make
curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn
```

## Then run:

```
sudo npm cache clean -f
sudo npm install -g n
sudo n 9
sudo npm install -g npm
```
(Mines now `node -v` = v9.11.2 - nodejs & npm are the same)

## Install Virtual Gamepad (Must Be Run As Root!)

```
sudo -i
cd /
git clone https://github.com/miroof/node-virtual-gamepads
cd node-virtual-gamepads
npm install
```

## Test it out
```
sudo node main.js
```


## Make the gamepad load at startup 

```
sudo npm install pm2 -g
sudo pm2 start main.js   # full path e.g. /home/pi/node-virtual-gamepad/main.js etc
sudo pm2 startup
sudo pm2 save
```


# EmulationStation Controller Config
(in `/opt/retropie/configs/all/retroarch-joypads/Virtualgamepad.cfg`)

```
input_device = "Virtual gamepad"
input_driver = "udev"
input_r_btn = "5"
input_save_state_btn = "5"
input_start_btn = "7"
input_exit_emulator_btn = "7"
input_l_btn = "4"
input_load_state_btn = "4"
input_up_axis = "-1"
input_a_btn = "0"
input_b_btn = "1"
input_reset_btn = "1"
input_down_axis = "+1"
input_right_axis = "+0"
input_state_slot_increase_axis = "+0"
input_x_btn = "2"
input_menu_toggle_btn = "2"
input_select_btn = "6"
input_enable_hotkey_btn = "6"
input_y_btn = "3"
input_left_axis = "-0"
input_state_slot_decrease_axis = "-0"
```

# Prevent "Welcome - No Gamepad Detected" on boot-up

You just need to configure a keyboard as a gamepad once. 
Then it seems to stop asking you on boot-up.

# Troubleshooting

## npm audit fix

Running this command can actually cause the gamepad not to run. So don't run it when it suggests, not unless `sudo node main.js` fails. 

## other errors

Most other errors are solved by simply removing the `node_modules` directory and performing `sudo npm install` again.
