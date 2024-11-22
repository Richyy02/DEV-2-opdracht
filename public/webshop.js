/* esversion: 6 */

/**
 * jQuery-like element(s) selector
 * @param {string} query
 */
var $ = function (query) {
    if (query.startsWith("#")) {
        return document.querySelector(query);
    } else {
        return document.querySelectorAll(query);
    }
}

// Constants
const API_PREFIX = 'api/';

// Elements
var containerMain = $('#container-main');

// JWT
var token;
var loggedInUser;

// Shopping cart
var cart = [];


/**
 * Sends a request to api/<path>
 * @param {string} path 
 * @param {apiCallback} successHandler
 * @param {apiCallback} errorHandler
 * @param {string} method 
 * @param {object} data 
 */
function api(path, successHandler, errorHandler = (response, status) => {}, method = 'GET', data = {}, prefix = API_PREFIX) {
    let xHttp = new XMLHttpRequest();

    xHttp.onreadystatechange = function () {
        if (xHttp.readyState == XMLHttpRequest.DONE) {
            try {
                let response = JSON.parse(xHttp.response);
                if (xHttp.status >= 200 && xHttp.status < 300) {
                    successHandler(response, xHttp.status);
                    if (response.message) {
                        notify(response.message, 'info');
                    }
                } else {
                    errorHandler(response, xHttp.status);
                    if (response.message) {
                        if(typeof response.message === 'object'){
                            for(let key in response.message){
                                notify('[' + xHttp.status + '] ' + key + ': ' + response.message[key], 'error');
                            }
                        } else {
                            notify(xHttp.status + ': ' + response.message, 'error');
                        }
                    } 
                    if (xHttp.status == 401) {
                        setUserLoggedOut();
                    }
                }
            } catch (err) {
                if (method != 'OPTIONS') {
                    notify(xHttp.status, 'error');
                }
                errorHandler({}, xHttp.status);
            }
        }
    }

    xHttp.onerror = function () {
        errorHandler({}, xHttp.status);
    }

    let url = prefix + path;
    xHttp.open(method, url, true);
    xHttp.setRequestHeader('Content-Type', 'application/json');
    if (getCookie('token')) xHttp.setRequestHeader('Authorization', 'Bearer ' + getCookie('token'));
    xHttp.send(JSON.stringify(data));
}

/**
 * Callback for api
 *
 * @callback apiCallback
 * @param {object} response
 * @param {string} code 
 */

/**
 * Callback for page loading
 *
 * @callback pageCallback
 */

/**
 * Loads a page into an HTML element
 * @param {string} page 
 * @param {string} target 
 * @param {pageCallback} callback
 */
function loadPage(page, target = containerMain, callback = function () {}) {
    console.info("Loading page", page);
    fetch('pages/' + page + ".html")
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            target.innerHTML = data;
            location.hash = page;
            callback();
            bindLinks();
        })
        .catch(function (error) {
            console.error(error);
        });
}

/**
 * Click handler for page-link classes
 * @param event 
 */
function loadHandler(event) {
    event.preventDefault();
    loadPage(event.target.dataset.page, containerMain);
}

/**
 * Click handler for action-link classes
 * @param event 
 */
function actionHandler(event) {
    event.preventDefault();
    let func = getFirstParentData(event.target, 'action');
    console.log('Executing handler', func);
    if (typeof window[func] == 'function') {
        window[func](event);
    } else {
        console.error('function ' + func + '() does not exist');
    }
}

/**
 * Get the dataset-data of the first parent element that has an attribute data
 * @param {*} element 
 * @param {*} data attribute
 */
function getFirstParentData(element, data) {
    while (!element.dataset[data]) {
        element = element.parentElement;
    }
    return element.dataset[data];
}

/** 
 * Bind element click events
 */
function bindLinks() {
    // Page links
    let pageLinks = document.getElementsByClassName('page-link');
    Array.from(pageLinks).forEach(function (link) {
        link.removeEventListener("click", loadHandler);
        link.addEventListener("click", loadHandler);
    });

    // Action links
    let actionLinks = document.getElementsByClassName('action-link');
    Array.from(actionLinks).forEach(function (link) {
        link.removeEventListener("click", actionHandler);
        link.addEventListener("click", actionHandler);
    });
}

// Actions

/**
 * Search
 * @param {*} event 
 */
function search(event) {
    let query = document.getElementById("search-query").value.replace(/ /g, "+");
    let url = 'products?q=' + query;
    api(
        url,
        function (response, status) {
            let data = response;
            showProducts(data.products, data.amount);
        },
        function (response, status) {
            if(response.message){
                console.error('Search failed:', response.message);
            }
        }
    );
}

/**
 * Login
 * @param {*} event 
 */
function login(event) {
    let username = document.getElementById("login-username").value;
    let password = document.getElementById("login-password").value;

    api(
        'auth',
        (response, status) => {
            setCookie('token', response.access_token, 240);
            loadUser();
            loadPage('welcome');
        },
        (response, status) => {
            if (response.description) {
                notify('Invalid credentials', 'error');
            }
        },
        'POST', {
            username: username,
            password: password
        }
    )
}

/**
 * Log the cuurent user out
 * @param event 
 */
function logout(event) {
    setUserLoggedOut();
    loadPage('welcome');
}

/**
 * Callback for loadUser
 *
 * @callback loadUserCallback
 */

/**
 * 
 * @param {loadUserCallback} callback 
 */
function loadUser(callback = function () {}) {
    if (getCookie('token')) {
        api(
            'users/me',
            function (response, status) {
                setUserLoggedIn(response);
                callback();
            },
            function (response, status) {
                setUserLoggedOut();
            }
        )
    } else {
        setUserLoggedOut();
    }
}

/**
 * 
 * @param {object} user 
 */
function setUserLoggedIn(user) {
    loggedInUser = user;
    $('.container-user')[0].innerText = 'welkom, ' + user.firstname;
    if (user.userrole.name == 'admin') {
        $('#menu-item-admin').classList.remove('hidden');
        $('#menu-item-orders').classList.remove('hidden');
    } else {
        $('#menu-item-admin').classList.add('hidden');
        $('#menu-item-orders').classList.add('hidden');
    }
    $('#link-login').className = 'action-link';
    $('#link-login').innerText = 'Uitloggen';
    bindLinks();
}

/**
 * Log the current user out by destroying the token cookie
 */
function setUserLoggedOut() {
    loggedInUser = null;
    deleteCookie('token');
    $('#menu-item-orders').classList.add('hidden');
    $('#menu-item-admin').classList.add('hidden');
    $('#link-login').className = 'page-link';
    $('#link-login').innerText = 'Inloggen';
}

/**
 * Show the user details page with the customer's orders
 * @param {*} event 
 */
function userDetails(event) {
    loadPage('user', containerMain, function () {
        $('.user-name')[0].innerText = loggedInUser.firstname + ' ' + loggedInUser.infix + ' ' + loggedInUser.lastname;
        $('.user-email')[0].innerText = loggedInUser.email;
        $('.user-address')[0].innerText = loggedInUser.street + ' ' + loggedInUser.housenumber + ', ' + loggedInUser.zipcode + ' ' + loggedInUser.city;
        $('.user-newsletter')[0].innerText = loggedInUser.newsletter ? 'Ja' : 'Nee';
        $('.user-country')[0].innerText = loggedInUser.country.name;

        loadPage('admin/orders', $('#container-user-orders'), function () {
            api(
                'users/' + loggedInUser.id + '/orders',
                function (response, status) {
                    showOrders(response.orders);
                }
            )
        });
    });
}

/**
 * Show the user edit screen
 * @param {*} event 
 */
function editUser(event) {
    loadPage('edituser', containerMain, function () {
        $('#user-edit-email').value = loggedInUser.email;
        $('#user-edit-firstname').value = loggedInUser.firstname;
        $('#user-edit-infix').value = loggedInUser.infix;
        $('#user-edit-lastname').value = loggedInUser.lastname;
        $('#user-edit-street').value = loggedInUser.street;
        $('#user-edit-housenumber').value = loggedInUser.housenumber;
        $('#user-edit-zipcode').value = loggedInUser.zipcode;
        $('#user-edit-city').value = loggedInUser.city;
        $('#user-edit-newsletter').value = loggedInUser.newsletter;
        $('.user-edit')[0].insertBefore(createSelect('country', loggedInUser.country), $('#user-edit-label-country').nextSibling);
    });

}

/**
 * Persist the edited user data
 * @param event 
 */
function saveUser(event) {
    let data = {};
    data.email = $('#user-edit-email').value;
    data.firstname = $('#user-edit-firstname').value;
    data.infix = $('#user-edit-infix').value;
    data.lastname = $('#user-edit-lastname').value;
    data.street = $('#user-edit-street').value;
    data.housenumber = $('#user-edit-housenumber').value;
    data.zipcode = $('#user-edit-zipcode').value;
    data.city = $('#user-edit-city').value;
    data.newsletter = $('#user-edit-newsletter').value;
    data.country = $('#select-country').value;

    api(
        'users/' + loggedInUser.id,
        function (response, status) {
            notify('Gegevens succesvol opgeslagen', 'info');
            loadUser(function () {
                userDetails();
            });
        },
        function (response, status) {

        },
        'PATCH',
        data
    );
}

/**
 * Load the page tot create a new user account
 * @param event 
 */
function loadCreateUser(event) {
    loadPage('new-account', containerMain, function () {
        let sel = createSelect('country');
        $('#address-line-2').appendChild(sel);
    });
}

/**
 * Persist the new user data
 * @param event 
 */
function createUser(event) {
    let data = {};
    data.email =        $('[name=email]')[0].value;
    data.password =     $('[name=password]')[0].value;
    data.firstname =    $('[name=firstname]')[0].value;
    data.infix =        $('[name=infix]')[0].value;
    data.lastname =     $('[name=lastname]')[0].value;
    data.street =       $('[name=street]')[0].value;
    data.housenumber =  $('[name=housenumber]')[0].value;
    data.zipcode =      $('[name=zipcode]')[0].value;
    data.city =         $('[name=city]')[0].value;
    data.newsletter =   $('[name=newsletter]')[0].checked ? 1 : 0;
    data.country =      $('[name=country]')[0].value;

    api(
        'users',
        function (response, status) {
            loadPage('login');
        },
        function (response, status) {

        },
        'POST',
        data
    );
}

/**
 * Load the product categories
 */
function loadCategories() {
    api(
        'categories',
        (response, status) => {
            showCategories(response.categories);
        },
        (response, status) => {
            console.info('categories not implemented yet');
        }
    )
}

/**
 * Show the product categories
 * @param {array} categories 
 */
function showCategories(categories) {
    let container = $('#content-categories');
    container.innerHTML = "";
    for (let i in categories) {
        let category = categories[i];
        var element = loadTemplate('template-category-item');
        element.querySelector('a').dataset.category = category.id;
        element.querySelector('a').innerText = category.name;
        container.appendChild(element);
    }
    bindLinks();
}

/**
 * Load all the products for a given category
 * @param event 
 */
function loadCategoryProducts(event) {
    let id = getFirstParentData(event.target, 'category');
    api(
        'categories/' + id + '/products',
        (response, status) => {
            showProducts(response.products);
        },
        (response, status) => {
            console.log('produts not implemented yet');
        }
    )
}

/**
 * Show given products
 * @param {array} products 
 */
function showProducts(products, amount = -1) {
    loadPage('products', containerMain,
        function () {
            $('.container-products')[0].innerHTML = "";
            if (amount >= 0) {
                $('.container-products')[0].innerHTML += "<span>aantal gevonden producten: " + amount + "</span>";
            }
            for (let i in products) {
                let product = products[i];
                let element = loadTemplate('template-products-item');
                let thumbnail = document.createElement('img');
                thumbnail.src = 'images/' + product.code + '.jpg';
                thumbnail.className = "product-item-thumbnail";

                element.querySelector('a').dataset.product = product.id;
                element.querySelector('.product-item-thumbnail').appendChild(thumbnail);
                element.querySelector('.product-item-title').innerText = product.title;
                element.querySelector('.product-item-description').innerText = product.description;
                element.querySelector('.product-item-price').innerText = formatPrice(product.price_vat);
                $('.container-products')[0].appendChild(element);
            }
        }
    );
}

/**
 * Load data for a specific product
 * @param {*} event 
 */
function loadProduct(event) {
    let id = getFirstParentData(event.target, 'product');
    api(
        'products/' + id,
        function (response, status) {
            showProduct(response);
        },
        function (response, status) {
            console.log('products/<id> not implemented yet');
        }
    )
}

/**
 * Show product detail page for a specifix product
 * @param {object} product 
 */
function showProduct(product) {
    loadPage('product', containerMain,
        function () {
            let image = document.createElement('img');
            image.src = 'images/' + product.code + '.jpg';
            image.className = "product-item-image";
            $('#product-title').innerText = product.title;
            $('#product-code').innerText = product.code;
            $('#product-image').innerHTML = "";
            $('#product-image').appendChild(image);
            $('#product-description').innerText = product.description;
            $('#product-price').innerText = formatPrice(product.price_vat);
            $('#product-stock').innerText = product.stock;
            $('#product-add-to-cart').dataset.product = JSON.stringify(product);
        }
    );
}

/**
 * Load an HTML <template> element
 * @param {string} id 
 */
function loadTemplate(id) {
    let temp = $('#' + id);
    return document.importNode(temp.content, true);
}


////////////////// ADMIN FUNCTIONS /////////////////

/**
 * Show admin panel
 * @param {*} event 
 */
function adminPanel(event) {
    let container = $('#container-admin');
    container.innerHTML = "";
    let resource = getFirstParentData(event.target, 'resource');
    api(
        resource,
        function (response, status) {
            container.appendChild(createAdminObjectTitle(resource));
            api(
                resource,
                function (options, status) {
                    container.appendChild(createAdminTable(response[resource], resource, options));
                    bindLinks();
                },
                function (options, status) {
                    container.appendChild(createAdminTable(response[resource], resource, ['GET', 'POST', 'PATCH', 'DELETE']));
                    bindLinks();
                },
                'OPTIONS'
            );
        }
    )
}

/**
 * Show title for an admin resource page
 * @param {string} resource 
 */
function createAdminObjectTitle(resource) {
    let header = document.createElement('div');
    header.className = 'container-columns';

    let title = document.createElement('h2');
    title.innerText = resource;
    header.appendChild(title);

    let createLink = document.createElement('a');
    createLink.className = 'button action-link';
    createLink.innerHTML = "Voeg " + resource + " toe";
    createLink.href = "javascript://";
    createLink.dataset.action = 'adminAdd';
    createLink.dataset.resource = resource;
    header.appendChild(createLink);

    return header;
}

/**
 * Create an HTML table for an admin resource page
 * @param {array} data 
 * @param {string} resource 
 * @param {array} options API method options
 */
function createAdminTable(data, resource, options) {
    let table = document.createElement('table');

    // Create table headers
    let tr = document.createElement('tr');
    for (let key in data[0]) {
        if (typeof (data[0][key]) != 'object' || !(Object.keys(data[0][key]).length == 0 || '0' in data[0][key])) {
            let th = document.createElement('th');
            th.innerText = key;
            tr.appendChild(th);
        }
    }

    // Edit and delete columns
    th = document.createElement('th');
    th.innerText = "";
    tr.appendChild(th);

    // Create table rows
    table.appendChild(tr);
    for (let i in data) {
        let tr = document.createElement('tr');
        for (let key in data[i]) {
            let value = data[i][key];
            let td = document.createElement('td');
            if (typeof (value) == 'object') {
                if (!(Object.keys(value).length == 0 || '0' in value)) {
                    // Field is foraign key
                    // get the id and the second value in the object
                    td.innerText = value.id + ' - ' + value[Object.keys(value)[1]];
                    tr.appendChild(td);
                }
            } else {
                td.innerText = value;
                tr.appendChild(td);
            }
        }

        // Edit icon
        let td = document.createElement('td');
        let editIcon = document.createElement('a');
        editIcon.innerHTML = "&#9998;";
        if (options.indexOf('PATCH') != -1) {
            editIcon.className = 'button action-link';
            editIcon.href = "javascript://";
            editIcon.dataset.action = 'adminEdit';
            editIcon.dataset.resource = resource + '/' + data[i].id;
        } else {
            editIcon.className = 'button disabled';
        }
        td.appendChild(editIcon);

        // Remove icon
        let removeIcon = document.createElement('a');
        removeIcon.innerHTML = "&#10006;";
        if (options.indexOf('DELETE') != -1) {
            removeIcon.className = 'button action-link';
            removeIcon.href = "javascript://";
            removeIcon.dataset.action = 'adminRemove';
            removeIcon.dataset.resource = resource + '/' + data[i].id;
        } else {
            removeIcon.className = 'button disabled';
        }
        td.appendChild(removeIcon);

        // Add icons to table
        tr.appendChild(td);

        table.appendChild(tr);
    }

    return table;
}

/**
 * Store a new element created by an admin
 * @param event 
 */
function adminAdd(event) {
    adminEdit(event);
}

/**
 * Store an edited element created by an admin
 * @param event 
 */
function adminEdit(event) {
    let resource = getFirstParentData(event.target, 'resource');
    loadPage('admin/edit');
    api(
        resource,
        function (response, status) {
            $('#admin-form').dataset.resource = resource;
            let newEntry = false;
            if (resource in response) {
                newEntry = true;
                response = response[resource][0];
            }
            for (let key in response) {
                if (key == 'id') continue;
                if (typeof (response[key]) == 'object') {
                    if (!(Object.keys(response[key]).length == 0 || '0' in response[key])) {
                        // field is foreign key
                        $('#admin-form').appendChild(createSelect(key, newEntry ? {} : response[key]));
                    }
                } else {
                    // field is own
                    createInputText(key, newEntry ? '' : response[key]);
                }
            }
        }
    )
}

/**
 * Remove an element
 * @param event 
 */
function adminRemove(event) {
    let resource = getFirstParentData(event.target, 'resource');
    api(
        resource,
        function (response, status) {
            loadPage('admin/index');
        },
        function (response, status) {

        },
        'DELETE'
    )
}

/**
 * Perist a resource
 * @param {*} event 
 */
function adminSave(event) {
    let resource = $('#admin-form').dataset.resource;
    let method = resource.includes('/') ? 'PATCH' : 'POST';
    let inputs = $('#admin-form').getElementsByTagName('input');
    let selects = $('#admin-form').getElementsByTagName('select');
    let data = [...inputs, ...selects];
    let object = {};

    for (let i in data) {
        let field = data[i];
        object[field.name] = field.value;
    }

    api(
        resource,
        function (response, status) {
            loadPage('admin/index');
        },
        function (response, status) {

        },
        method,
        object
    )
}

/**
 * Create HTML input element for a resource page
 * @param {string} name resource
 * @param {object} currentValue 
 */
function createInputText(name, currentValue) {
    let inp = loadTemplate('template-form-input-text');
    inp.querySelector('label').innerText = name;
    inp.querySelector('input').value = currentValue;
    inp.querySelector('input').name = name;
    $('#admin-form').appendChild(inp);
}

/**
 * Create HTML select element for a resource page
 * @param {string} name resource (singular)
 * @param {object} selectedValue 
 */
function createSelect(name, selectedValue = {
    id: 1
}) {
    let sel = loadTemplate('template-form-input-select');
    sel.querySelector('select').id = 'select-' + name;
    sel.querySelector('select').name = name;
    if (sel.querySelector('label')) {
        sel.querySelector('label').innerText = name;
    }
    createSelectOptions(name, selectedValue);
    return sel;
}

/**
 * Create <option>'s for HTML select element
 * @param {string} name resource
 * @param {object} selectedValue 
 */
function createSelectOptions(name, selectedValue) {
    api(
        pluralize(name),
        function (response, status) {
            let options = response[pluralize(name)];
            for (let i in options) {
                let option = options[i];
                let opt = loadTemplate('template-form-input-select-option');
                opt.querySelector('option').value = option.id;
                opt.querySelector('option').innerText = option.id + ' - ' + option['name'];
                if (option.id == selectedValue.id) {
                    opt.querySelector('option').selected = true;
                }
                $('#select-' + name).appendChild(opt);
            }
        }
    )
}

/**
 * Load all orders made by customers
 * @param event 
 */
function adminLoadOrders(event) {
    loadPage('admin/orders', containerMain,
        function () {
            api(
                'orders',
                function (response, status) {
                    showOrders(response.orders);
                }
            )
        }
    )
}

/**
 * Show given orders made by customers
 * @param {array} orders 
 */
function showOrders(orders) {
    let container = $('#table-orders');
    container.innerHTML = "";
    for (let i in orders) {
        let order = orders[i];
        let orderElement = loadTemplate('template-order');
        orderElement.querySelector('.order').id = 'order-' + order.id;
        orderElement.querySelector('.order').dataset.id = order.id;
        orderElement.querySelector('.order-user').innerText = order.user.firstname + ' ' + order.user.infix + ' ' + order.user.lastname;
        orderElement.querySelector('.order-date').innerText = order.date;

        if (loggedInUser.userrole.name == 'admin') {
            let paidSelect = orderElement.querySelector('.order-paid').querySelector('select');
            paidSelect.value = order.paid;
            paidSelect.name = 'order-paid-' + order.id;
            paidSelect.addEventListener('change', adminUpdateOrder);

            let shippedSelect = orderElement.querySelector('.order-shipped').querySelector('select');
            shippedSelect.value = order.shipped;
            shippedSelect.name = 'order-shipped-' + order.id;
            shippedSelect.addEventListener('change', adminUpdateOrder);
        } else {
            orderElement.querySelector('.order-paid').innerText = order.paid ? 'Ja' : 'Nee';
            orderElement.querySelector('.order-shipped').innerText = order.shipped ? 'Ja' : 'Nee';
        }

        container.appendChild(orderElement);

        let totalPrice = 0;

        for (let j in order.order_lines) {
            let orderLine = order.order_lines[j];
            let orderLineElement = loadTemplate('template-order-line');
            orderLineElement.querySelector('.order-line-product').innerText = orderLine.product.title;
            orderLineElement.querySelector('.order-line-amount').innerText = orderLine.amount;
            orderLineElement.querySelector('.order-line-price-vat').innerText += formatPrice(orderLine.total_price);
            container.appendChild(orderLineElement);
            totalPrice += orderLine.total_price;
        }

        $('#order-' + order.id).querySelector('.order-price-vat').innerText += formatPrice(totalPrice);
    }
    if (container.childElementCount > 0) {
        container.removeChild(container.children[0]); //remove first empty 'spacer' row
    }
}

/**
 * Update the statuses of an order
 * @param event 
 */
function adminUpdateOrder(event) {
    let id = getFirstParentData(event.target, 'id');
    let data = {}
    data[event.target.name.split('-')[1]] = event.target.value;
    api(
        'orders/' + id,
        function (response, status) {
            notify('Order aangepast', 'info');
        },
        function (response, status) {
            notify('Order niet aangepast!', 'error');
        },
        'PATCH',
        data
    )
}

/**
 * Pluralize a given string
 * @param {string} noun 
 */
function pluralize(noun) {
    return (noun.endsWith('y') ? noun.substring(0, noun.length - 1) + 'ies' : noun + 's');
}

/**
 * Store a cookie in the users' browser
 * @param {string} cname 
 * @param {string} cvalue 
 * @param {number} exmins 
 */
function setCookie(cname, cvalue, exmins) {
    var d = new Date();
    d.setTime(d.getTime() + (exmins * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

/**
 * Get a stored cookie from the users' browser
 * @param {string} cname 
 */
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

/**
 * Delete a stored cookie from the users' browser
 * @param {string} cname 
 */
function deleteCookie(cname) {
    setCookie(cname, '', -1);
}


/**
 * Format a price
 * @param {float} amount 
 * @param {int} decimalCount 
 * @param {string} decimal 
 * @param {string} thousands 
 */
function formatPrice(amount, decimalCount = 2, decimal = ",", thousands = ".") {
    try {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

        const negativeSign = amount < 0 ? "-" : "";

        amount = amount / 100;

        let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
        let j = (i.length > 3) ? i.length % 3 : 0;

        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
    } catch (e) {
        console.log(e);
    }
};

/**
 * Show shopping cart page including all items
 * @param event 
 */
function showCart(event) {
    loadPage('cart', containerMain, function () {
        let container = $("#container-cart-products");
        let totalPrice = 0.00;

        container.innerHTML = "";

        for (let item in cart) {
            let element = loadTemplate('template-cart-product');
            let orderLinePrice = cart[item].amount * cart[item].price_vat;
            totalPrice += orderLinePrice;
            element.querySelector('.cart-product-name').innerText = cart[item].title;
            element.querySelector('.cart-product-price').innerText = formatPrice(cart[item].price_vat);
            element.querySelector('.cart-product-amount').innerText = cart[item].amount;
            element.querySelector('.cart-product-totalprice').innerText = formatPrice(orderLinePrice);
            container.appendChild(element);
        }

        $("#cart-total").innerText = formatPrice(totalPrice);
    });
}

/**
 * Add a product to the shopping cart
 * @param event 
 */
function addToCart(event) {
    let product = JSON.parse(getFirstParentData(event.target, "product"));

    // Update amount in shopping cart or add new item
    if (product.id in cart) {
        cart[product.id].amount++;
    } else {
        cart[product.id] = product;
        cart[product.id].amount = 1;
    }

    updateCartCount();

    notify("Product toegevoegd aan winkelwagen", "info");
    console.log(cart);
}

function notify(msg, type) {
    let n = document.createElement("div");
    n.innerText = msg;
    n.className = type;
    $('#notifications').appendChild(n);
    setTimeout(function () {
        n.parentElement.removeChild(n);
    }, 10000);
}

/**
 * Update cart count in menu
 */
function updateCartCount() {
    let count = 0;
    for (item in cart) {
        count += cart[item].amount;
    }
    $("#cart-item-count").innerText = count;
}

/**
 * Submit an order
 * @param event 
 */
function submitOrder(event) {
    let order = {
        lines: []
    };
    for (item in cart) {
        order.lines.push({
            product: cart[item].id,
            amount: cart[item].amount
        })
    }
    api('orders',
        function (response, status) {
            notify("Uw order is succesvol verzonden!", "info");
            cart = [];
            updateCartCount();
            loadPage('cart');
        },
        function (response, status) {
            console.log(status);
            switch (status) {
                case 401:
                    notify("U kunt alleen bestellen als u bent ingelogd", "error");
                    break;
                default:
                    notify("Uw order is helaas niet succesvol ontvangen. Onze developers zijn nu op de hoogte gebracht van dit probleem", "error");
            }
        },
        "POST",
        order
    );
}


/////////////// INITIALIZATION /////////////////

// (Re)load page with fallback to welcome page
if (location.hash) {
    loadPage(location.hash.replace('#', ''), containerMain);
} else {
    loadPage('welcome', containerMain);
}
bindLinks();
loadCategories();
loadUser();