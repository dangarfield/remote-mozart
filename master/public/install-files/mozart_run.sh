#!/bin/bash
stop_script="mozart_stop.sh"
scripts_folder=".mozart/"
mozart_worker_jobs="jobs"
file_watcher="mozart_fileWatcher.sh"
event_file="mozart_event.txt"
exec_script="mozart_execScript.sh"

install_file_watcher_linux() {
    cat >$scripts_folder$file_watcher <<-EOM
#!/bin/sh
pkill -f "inotifywait -q -m -e close_write ./$event_file" # kill old watcher
LOG="log.txt"
LOG_SIZE=\$(stat -c%s \$LOG)

which inotifywait >/dev/null || err "you need 'inotifywait' command (sudo apt-get install inotify-tools)"
inotifywait -q -m -e close_write  ./$event_file |
while read -r filename event; do

  if [ "\$LOG_SIZE" -gt 52428800 ]  # limit = 50MB
  then
    mv \$LOG \$LOG".old"  # log rotation
  fi

  printf '\n\n\n\n' >> \$LOG
  echo '--------- EVENT: ' \$(date -u +'%F %T UTC') '---------' >> \$LOG
  cat ./$event_file >> \$LOG
  printf '\n\n--- SCRIPT EVENT PROCESSING ---\n\n' >> \$LOG
  ./$exec_script >> \$LOG 2>&1
done
EOM
}
install_stop_script_linux() {
    cat >$stop_script <<-EOM
#!/bin/sh
cd $scripts_folder
pkill -f "inotifywait -q -m -e close_write ./$event_file"
cd ..
EOM
}
install_file_watcher_mac() {
    cat >$scripts_folder$file_watcher <<-EOM
#!/bin/sh
pkill -f "fswatch -0 ./$event_file" # kill old watcher
if [ "$1" != "stop" ]; then
  which fswatch >/dev/null || err "you need 'fswatch' command (brew install fswatch)"
  fswatch -0 ./$event_file | xargs -0 -n1 ./$exec_script
fi
docker stop remozart-${DEVICE_NAME}
EOM
}
install_stop_script_mac() {
    cat >$stop_script <<-EOM
#!/bin/sh
cd $scripts_folder
pkill -f "fswatch -0 ./$event_file"
cd ..
docker stop remozart-${DEVICE_NAME}
EOM
}
install_exec_script() {
    cat >$scripts_folder$exec_script <<-EOM
event_type=\$(sed '1q;d' ./$event_file)
event_data=\$(sed '2q;d' ./$event_file)

echo "EVENT: " \$event_type \$event_data

if [ \$event_type = 'deploy' ]; then
    echo " - DEPLOY: " \$event_data

    cd ..
    if [ -x "stop.sh" ]; then
        echo "   - 1 - Run stop file"
        . ./stop.sh
    else
        echo "   - 1 - No stop file to run"
    fi

    echo "   - 2 - Removing old files"
    ls | grep -v mozart
    ls | grep -v mozart | xargs rm -r

    echo "   - 3 - Copy new files"
    cd $scripts_folder$mozart_worker_jobs/\$event_data
    chmod u+x stop.sh
    chmod u+x run.sh
    cp -r . ../../..
    cd ../../..
    ls | grep -v mozart
    # Set executable file permissions"

    echo "   - 4 - Run run file"
    . ./run.sh

    # cd ..
    # ls | grep -v mozart | xargs rm -r
    # cd ../$scripts_folder$mozart_worker_jobs/\$event_data
    # cp -r . ../..
elif [ \$event_type = 'debug' ]; then
    echo " - DEBUG: " \$event_data
else
    echo ' - UNKNOWN event' \$event_type
fi
EOM
}

create_event_file() {
    touch >$scripts_folder$event_file
}

validate_environment_variables() {
    echo '  Checking environmnet variables'
    if [ -f .env.mozart ]; then
        export $(cat .env.mozart | sed 's/#.*//g' | xargs)
    fi

    if [[ -z "${DEVICE_GROUP}" ]]; then
        echo 'Error: Environment variable DEVICE_GROUP not set.' >&2
        exit 1
    elif [[ -z "${DEVICE_NAME}" ]]; then
        echo 'Error: Environment variable DEVICE_NAME not set.' >&2
        exit 1
    elif [[ -z "${MASTER_URL}" ]]; then
        echo 'Error: Environment variable MASTER_URL not set.' >&2
        exit 1
    elif [[ -z "${MASTER_USERNAME}" ]]; then
        echo 'Error: Environment variable MASTER_USERNAME not set.' >&2
        exit 1
    elif [[ -z "${MASTER_PASSWORD}" ]]; then
        echo 'Error: Environment variable MASTER_PASSWORD not set.' >&2
        exit 1
    fi
}

launch_docker_worker() {
    echo '  Launching docker worker'
    if ! [ -x "$(command -v docker)" ]; then
        echo 'Error: docker is not installed.' >&2
        exit 1
    fi
    if ! [ -x "$(command -v docker-compose)" ]; then
        echo 'Error: docker-compose is not installed.' >&2
        exit 1
    fi

    # docker exec -it mozart-worker ash

    # docker stop mozart-worker
    # docker rm mozart-worker

    # docker run --name mozart-worker \
    #     -d \
    #     -v "$(pwd)"/mozart_scripts:/mozart_scripts \
    #     --env-file .env.mozart \
    #     dangarfield/docker-mozart-worker:latest \
    #     pm2-runtime pm2.json

    # docker run -v `pwd`/.mozart:/.mozart:cached --env-file .env.mozart dangarfield/docker-mozart-worker
    docker run --name remozart-${DEVICE_NAME} -d -v $(pwd)/.mozart:/.mozart:cached --env-file .env.mozart dangarfield/docker-mozart-worker:latest
}

install() {
    echo '--- Installing ---'
    validate_environment_variables

    echo '  Creating scripts worker folder'
    mkdir -p $scripts_folder$mozart_worker_jobs

    echo '  Creating file watcher'
    case $(uname) in
    Linux) # ubuntu
        echo 'Linux'
        install_file_watcher_linux
        install_stop_script_linux
        if ! [ -x "$(command -v inotifywait)" ]; then
            echo 'Error: inotifywait is not installed.' >&2
            exit 1
        fi
        ;;
    Darwin) # mac os
        echo 'Mac'
        install_file_watcher_mac
        install_stop_script_mac
        if ! [ -x "$(command -v fswatch)" ]; then
            echo 'Error: fswatch is not installed.' >&2
            exit 1
        fi
        ;;
    esac
    install_exec_script
    create_event_file

    # TODO - File permissions?
    chmod -R +x ./$scripts_folder$mozart_worker_jobs
    chmod +x ./$scripts_folder$exec_script
    chmod +x ./$scripts_folder$file_watcher
    chmod 666 ./$scripts_folder$event_file

    echo '  Launching file watcher'
    cd $scripts_folder
    nohup ./$file_watcher >/dev/null 2>&1 &
    cd ..
    launch_docker_worker
}

install

# curl -sLOS http://localhost:3000/api/mozart_run.sh && . ./mozart_run.sh
