(function () {
  function initializeAdmin() {
  'use strict';

  var config = window.CLEANSMITH_SUPABASE_CONFIG || {};
  var loginPanel = document.getElementById('loginPanel');
  var dashboard = document.getElementById('dashboard');
  var loginStatus = document.getElementById('loginStatus');
  var dashboardStatus = document.getElementById('dashboardStatus');
  var client;
  var plans = [];
  var sitePages = [];

  function message(node, text, error) {
    node.textContent = text || '';
    node.classList.toggle('error', Boolean(error));
  }

  function configured() {
    return config.url && config.anonKey &&
      config.url.indexOf('YOUR_PROJECT_ID') === -1 &&
      config.anonKey.indexOf('YOUR_SUPABASE_') === -1 &&
      window.supabase && window.supabase.createClient;
  }

  function call(result) {
    return result.then(function (response) {
      if (response.error) throw response.error;
      return response.data;
    });
  }

  function rows(table, column) {
    return call(client.from(table).select('*').order(column, { ascending: true }));
  }

  function formValues(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function nullableId(value) {
    return value || null;
  }

  function lines(value) {
    return String(value || '').split(/\r?\n/).map(function (line) {
      return line.trim();
    }).filter(Boolean);
  }

  function number(value) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error('Enter a valid number.');
    return parsed;
  }

  function save(table, id, values) {
    var query = id
      ? client.from(table).update(values).eq('id', id)
      : client.from(table).insert(values);
    return call(query.select().single());
  }

  function remove(table, id) {
    return call(client.from(table).delete().eq('id', id));
  }

  function make(tag, text, className) {
    var node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function actionButton(label, callback, danger) {
    var button = make('button', label, 'btn ' + (danger ? 'danger' : 'secondary'));
    button.type = 'button';
    button.addEventListener('click', callback);
    return button;
  }

  function card(list, title, detail, edit, del, media) {
    var item = make('article', undefined, 'item');
    if (media) item.appendChild(media);
    var main = make('div', undefined, 'item-main');
    main.appendChild(make('div', title, 'item-title'));
    main.appendChild(make('small', detail || '', 'muted'));
    item.appendChild(main);
    var actions = make('div', undefined, 'item-actions');
    actions.appendChild(actionButton('Edit', edit, false));
    actions.appendChild(actionButton('Delete', del, true));
    item.appendChild(actions);
    list.appendChild(item);
  }

  function resetForm(form) {
    form.reset();
    form.elements.id.value = '';
  }

  function editForm(form, record, transforms) {
    Object.keys(record).forEach(function (key) {
      var control = form.elements.namedItem(key);
      if (!control) return;
      var value = record[key];
      if (transforms && transforms[key]) value = transforms[key](value);
      control.value = value == null ? '' : value;
    });
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateVehiclePriceFields(form) {
    var isCarWash = form.elements.service_slug.value === 'car-wash';
    form.querySelector('[data-car-price-fields]').hidden = !isCarWash;
    ['hatch', 'sedan', 'suv', 'luxury', 'minibus'].forEach(function (vehicle) {
      form.elements['price_' + vehicle].required = isCarWash;
    });
  }

  function renderPackages(data) {
    var list = document.getElementById('packageList');
    var serviceNames = {
      'car-wash': 'Car wash',
      'home-cleaning': 'Home cleaning',
      gardening: 'Gardening'
    };
    list.replaceChildren();
    data.forEach(function (pkg) {
      card(list, pkg.name + ' — R' + Number(pkg.starting_price).toLocaleString('en-ZA'),
        (serviceNames[pkg.service_slug] || 'Car wash') + ' · ' +
        (pkg.is_active ? 'Visible' : 'Hidden') + ' · ' + pkg.slug,
        function () {
          var form = document.getElementById('packageForm');
          editForm(form, pkg, {
            features: function (items) { return (items || []).join('\n'); },
            is_active: String,
            sort_order: String
          });
          updateVehiclePriceFields(form);
          ['hatch', 'sedan', 'suv', 'luxury', 'minibus'].forEach(function (vehicle) {
            form.elements['price_' + vehicle].value = pkg.vehicle_prices && pkg.vehicle_prices[vehicle] != null
              ? pkg.vehicle_prices[vehicle]
              : '';
          });
        },
        function () {
          if (!window.confirm('Delete this package?')) return;
          remove('packages', pkg.id).then(refresh).then(function () {
            message(dashboardStatus, 'Package deleted.');
          }).catch(showError);
        });
    });
  }

  function editSitePage(form, page) {
    form.elements.hero_image_file.value = '';
    editForm(form, page);
  }

  function renderSitePages(data) {
    sitePages = data;
    var form = document.getElementById('sitePageForm');
    var select = form.elements.slug;
    var list = document.getElementById('sitePageList');
    var names = {
      'car-wash': 'Car Wash',
      'home-cleaning': 'Home Cleaning',
      gardening: 'Gardening',
      about: 'About Us'
    };
    var selectedSlug = select.value || 'car-wash';
    select.replaceChildren();
    Object.keys(names).forEach(function (slug) {
      select.add(new Option(names[slug], slug));
    });
    select.value = selectedSlug in names ? selectedSlug : 'car-wash';

    list.replaceChildren();
    data.forEach(function (page) {
      var item = make('article', undefined, 'item');
      var main = make('div', undefined, 'item-main');
      main.appendChild(make('div', names[page.slug] || page.slug, 'item-title'));
      main.appendChild(make('small', page.hero_cta_text || 'No call-to-action text set', 'muted'));
      item.appendChild(main);
      var actions = make('div', undefined, 'item-actions');
      actions.appendChild(actionButton('Edit', function () {
        select.value = page.slug;
        editSitePage(form, page);
      }, false));
      item.appendChild(actions);
      list.appendChild(item);
    });

    var selectedPage = data.find(function (page) { return page.slug === select.value; });
    if (selectedPage) editSitePage(form, selectedPage);
  }

  function renderPlans(data) {
    plans = data;
    var list = document.getElementById('planList');
    var select = document.getElementById('memberPlan');
    list.replaceChildren();
    select.replaceChildren(new Option('No plan', ''));
    data.forEach(function (plan) {
      select.add(new Option(plan.name, plan.id));
      card(list, plan.name + ' — R' + Number(plan.price).toLocaleString('en-ZA') + ' / ' + plan.billing_interval,
        (plan.is_active ? 'Visible' : 'Hidden') + ' · ' + (plan.benefits || []).length + ' benefits',
        function () {
          editForm(document.getElementById('planForm'), plan, {
            benefits: function (items) { return (items || []).join('\n'); },
            is_active: String,
            sort_order: String
          });
        },
        function () {
          if (!window.confirm('Delete this membership plan? Member records will be kept without a plan.')) return;
          remove('membership_plans', plan.id).then(refresh).then(function () {
            message(dashboardStatus, 'Membership plan deleted.');
          }).catch(showError);
        });
    });
    var memberSelect = document.getElementById('memberForm').elements.plan_id;
    var selected = memberSelect.value;
    memberSelect.replaceChildren(new Option('No plan', ''));
    data.forEach(function (plan) { memberSelect.add(new Option(plan.name, plan.id)); });
    memberSelect.value = selected;
  }

  function renderMembers(data) {
    var list = document.getElementById('memberList');
    list.replaceChildren();
    data.forEach(function (member) {
      var plan = plans.find(function (item) { return item.id === member.plan_id; });
      card(list, member.full_name, [member.email, member.phone, plan ? plan.name : 'No plan', member.status].filter(Boolean).join(' · '),
        function () {
          editForm(document.getElementById('memberForm'), member, {
            joined_at: function (date) { return date ? String(date).slice(0, 10) : ''; }
          });
        },
        function () {
          if (!window.confirm('Delete this member record?')) return;
          remove('members', member.id).then(refresh).then(function () {
            message(dashboardStatus, 'Member record deleted.');
          }).catch(showError);
        });
    });
  }

  function renderTeam(data) {
    var list = document.getElementById('teamList');
    list.replaceChildren();
    data.forEach(function (member) {
      var preview = member.image_url ? make('img') : null;
      if (preview) {
        preview.src = member.image_url;
        preview.alt = member.name;
      }
      card(list, member.name, [member.role, member.is_active ? 'Visible' : 'Hidden'].filter(Boolean).join(' · '),
        function () {
          editForm(document.getElementById('teamForm'), member, {
            is_active: String,
            sort_order: String
          });
        },
        function () {
          if (!window.confirm('Delete this team profile?')) return;
          remove('team_members', member.id).then(function () {
            if (member.storage_path) {
              return call(client.storage.from('cleansmith-work').remove([member.storage_path]));
            }
          }).then(refresh).then(function () {
            message(dashboardStatus, 'Team profile deleted.');
          }).catch(showError);
        }, preview);
    });
  }

  function renderGallery(data) {
    var list = document.getElementById('galleryList');
    list.replaceChildren();
    var serviceNames = {
      'car-wash': 'Car wash',
      'home-cleaning': 'Home cleaning',
      gardening: 'Gardening'
    };
    data.forEach(function (work) {
      var preview;
      if (work.media_type === 'before_after') {
        preview = make('div', undefined, 'gallery-pair-preview');
        [work.before_media_url, work.after_media_url].forEach(function (url, index) {
          var image = make('img');
          image.src = url || '';
          image.alt = index ? 'After' : 'Before';
          preview.appendChild(image);
        });
      } else {
        preview = work.media_type === 'video' ? make('video') : make('img');
        preview.src = work.media_url;
      }
      if (work.media_type === 'video') {
        preview.muted = true;
        preview.playsInline = true;
      } else if (work.media_type !== 'before_after') {
        preview.alt = work.alt_text || work.title;
      }
      card(list, work.title, (serviceNames[work.service_slug] || 'Car wash') + ' · ' +
        (work.is_published ? 'Published' : 'Hidden') + ' · ' +
        (work.media_type === 'before_after' ? 'Before & after' : work.media_type),
        function () {
          var form = document.getElementById('galleryForm');
          editForm(form, work, { is_published: String, sort_order: String });
          updateGalleryMediaFields(form);
        },
        function () {
          if (!window.confirm('Delete this gallery item?')) return;
          remove('work_gallery', work.id).then(function () {
            return removeStoragePaths([
              work.storage_path,
              work.before_storage_path,
              work.after_storage_path
            ]);
          }).then(refresh).then(function () {
            message(dashboardStatus, 'Gallery item deleted.');
          }).catch(showError);
        }, preview);
    });
  }

  function refresh() {
    return Promise.all([
      rows('packages', 'sort_order'),
      rows('site_pages', 'sort_order'),
      rows('membership_plans', 'sort_order'),
      rows('members', 'full_name'),
      rows('work_gallery', 'sort_order'),
      rows('team_members', 'sort_order')
    ]).then(function (data) {
      renderPackages(data[0]);
      renderSitePages(data[1]);
      renderPlans(data[2]);
      renderMembers(data[3]);
      renderGallery(data[4]);
      renderTeam(data[5]);
    });
  }

  function showError(error) {
    console.error('CLEANSMITH admin operation failed:', error);
    message(dashboardStatus, error && error.message ? error.message : 'The request failed. Please try again.', true);
  }

  function connectForm(formId, table, prepare, afterSave) {
    var form = document.getElementById(formId);
    form.addEventListener('reset', function () {
      window.setTimeout(function () { form.elements.id.value = ''; }, 0);
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      message(dashboardStatus, 'Saving…');
      try {
        var raw = formValues(form);
        var id = raw.id;
        var selectedPageSlug = formId === 'sitePageForm' ? raw.slug : '';
        delete raw.id;
        var prepared;
        var uploadedPaths = [];
        var persisted = false;
        Promise.resolve(prepare(raw, form)).then(function (values) {
          prepared = values;
          uploadedPaths = values._uploaded_paths || [];
          delete values._uploaded_paths;
          return save(table, id, values);
        }).then(function (record) {
          persisted = true;
          if (afterSave) return afterSave(record, raw, prepared);
        }).then(function () {
          resetForm(form);
          if (selectedPageSlug) form.elements.slug.value = selectedPageSlug;
          return refresh();
        }).then(function () {
          message(dashboardStatus, 'Saved successfully.');
        }).catch(function (error) {
          if (!persisted && uploadedPaths.length) {
            removeStoragePaths(uploadedPaths)
              .then(function () { showError(error); })
              .catch(function (cleanupError) {
                console.error('Unable to clean up files from the failed save:', cleanupError);
                showError(new Error((error.message || 'The save failed.') + ' Uploaded files could not be removed.'));
              });
            return;
          }
          showError(error);
        });
      } catch (error) {
        showError(error);
      }
    });
  }

  function publicUrl(path) {
    return client.storage.from('cleansmith-work').getPublicUrl(path).data.publicUrl;
  }

  function getFormFile(form, name) {
    var control = form && form.elements && form.elements.namedItem(name);
    return control && control.files && control.files.length ? control.files[0] : null;
  }

  function getFormFiles(form, name) {
    var control = form && form.elements && form.elements.namedItem(name);
    return control && control.files ? Array.prototype.slice.call(control.files) : [];
  }

  function removeStoragePaths(paths) {
    var uniquePaths = Array.from(new Set((paths || []).filter(Boolean)));
    if (!uniquePaths.length) return Promise.resolve();
    return call(client.storage.from('cleansmith-work').remove(uniquePaths));
  }

  function uploadFiles(files, folder) {
    var uploaded = [];
    return files.reduce(function (promise, file) {
      return promise.then(function () {
        if (file.size > 104857600) throw new Error('Files must be 100 MB or smaller.');
        var name = String(file.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '-');
        var path = folder + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '-' + name;
        return call(client.storage.from('cleansmith-work').upload(path, file, { upsert: false })).then(function () {
          uploaded.push({ path: path, url: publicUrl(path) });
        });
      });
    }, Promise.resolve()).then(function () {
      return uploaded;
    }).catch(function (error) {
      if (!uploaded.length) throw error;
      return removeStoragePaths(uploaded.map(function (item) { return item.path; })).then(function () {
        throw error;
      }, function (cleanupError) {
        throw new Error((error.message || 'The upload failed.') + ' Some uploaded files could not be removed: ' +
          (cleanupError.message || 'storage cleanup failed.'));
      });
    });
  }

  function uploadTeamPhoto(values, form) {
    var file = getFormFile(form, 'image_file');
    if (file && file.type.indexOf('image/') !== 0) {
      throw new Error('Choose a supported image file for the team photo.');
    }
    delete values.image_file;
    values.sort_order = number(values.sort_order);
    values.is_active = values.is_active === 'true';
    if (!file && !values.image_url) throw new Error('Upload a team photo before saving this profile.');
    return (file ? uploadFiles([file], 'team') : Promise.resolve([])).then(function (uploads) {
      if (uploads.length) {
        values.storage_path = uploads[0].path;
        values.image_url = uploads[0].url;
        values._uploaded_paths = [uploads[0].path];
      }
      if (!values.image_url) throw new Error('Upload a team photo before saving this profile.');
      delete values.id;
      return values;
    });
  }

  function uploadWork(form, values) {
    var type = values.media_type || 'image';
    var uploadedPaths = [];
    delete values.media_file;
    delete values.before_file;
    delete values.after_file;

    if (type === 'before_after') {
      var beforeFile = getFormFile(form, 'before_file');
      var afterFile = getFormFile(form, 'after_file');
      if (!beforeFile && !values.before_media_url) throw new Error('Upload a before image.');
      if (!afterFile && !values.after_media_url) throw new Error('Upload an after image.');
      [beforeFile, afterFile].filter(Boolean).forEach(function (file) {
        if (file.type.indexOf('image/') !== 0) throw new Error('Before-and-after comparisons only support images.');
      });
      var tasks = [];
      if (beforeFile) tasks.push(function () {
        return uploadFiles([beforeFile], 'gallery/before').then(function (uploads) {
          values.before_media_url = uploads[0].url;
          values.before_storage_path = uploads[0].path;
          uploadedPaths.push(uploads[0].path);
        });
      });
      if (afterFile) tasks.push(function () {
        return uploadFiles([afterFile], 'gallery/after').then(function (uploads) {
          values.after_media_url = uploads[0].url;
          values.after_storage_path = uploads[0].path;
          uploadedPaths.push(uploads[0].path);
        });
      });
      return tasks.reduce(function (promise, task) {
        return promise.then(task);
      }, Promise.resolve()).catch(function (error) {
        return removeStoragePaths(uploadedPaths).then(function () {
          throw error;
        });
      }).then(function () {
        values.media_url = values.before_media_url;
        values.media_type = 'before_after';
        values.storage_path = null;
        values._uploaded_paths = uploadedPaths;
        delete values.id;
        return values;
      });
    }

    var file = getFormFile(form, 'media_file');
    if (type !== 'image' && type !== 'video') throw new Error('Choose a valid gallery type.');
    if (file) {
      var actualType = file.type.indexOf('video/') === 0 ? 'video' : file.type.indexOf('image/') === 0 ? 'image' : '';
      if (!actualType) throw new Error('Choose a supported image or video file.');
      if (actualType !== type) throw new Error('The selected file does not match the gallery type.');
    } else if (!values.media_url) {
      throw new Error('Select an image or video file to upload.');
    }
    values.before_media_url = null;
    values.after_media_url = null;
    values.before_storage_path = null;
    values.after_storage_path = null;
    var upload = file ? uploadFiles([file], 'gallery') : Promise.resolve([]);
    return upload.then(function (uploads) {
      if (uploads.length) {
        values.storage_path = uploads[0].path;
        values.media_url = uploads[0].url;
        values._uploaded_paths = [uploads[0].path];
      }
      values.media_type = type;
      delete values.id;
      return values;
    });
  }

  function updateGalleryMediaFields(form) {
    var isBeforeAfter = form.elements.media_type.value === 'before_after';
    form.querySelector('[data-gallery-single-file]').hidden = isBeforeAfter;
    form.querySelector('[data-gallery-before-file]').hidden = !isBeforeAfter;
    form.querySelector('[data-gallery-after-file]').hidden = !isBeforeAfter;
  }

  function prepareSitePage(values, form) {
    var file = getFormFile(form, 'hero_image_file');
    delete values.hero_image_file;
    values.hero_image_url = String(values.hero_image_url || '').trim();
    values.hero_cta_text = String(values.hero_cta_text || '').trim();
    if (!file && values.hero_image_url &&
        !/^https?:\/\//i.test(values.hero_image_url) &&
        !/^\/(?!\/)/.test(values.hero_image_url)) {
      throw new Error('Enter a full image URL or a path starting with /.');
    }
    if (!file) return values;
    if (file.type.indexOf('image/') !== 0) {
      throw new Error('Choose a supported image file for the hero image.');
    }
    return uploadFiles([file], 'hero').then(function (uploads) {
      values.hero_image_url = uploads[0].url;
      values._uploaded_paths = [uploads[0].path];
      return values;
    });
  }

  function cleanupReplacedGalleryFiles(record, previous, saved) {
    var oldPaths = [previous.storage_path, previous.before_storage_path, previous.after_storage_path];
    var savedPaths = [saved.storage_path, saved.before_storage_path, saved.after_storage_path];
    return removeStoragePaths(oldPaths.filter(function (path) {
      return path && savedPaths.indexOf(path) === -1;
    }));
  }

  function setupDashboard() {
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (item) {
          item.classList.toggle('active', item === tab);
        });
        document.querySelectorAll('[data-section]').forEach(function (section) {
          section.hidden = section.dataset.section !== tab.dataset.tab;
        });
        message(dashboardStatus, '');
      });
    });

    connectForm('packageForm', 'packages', function (values) {
      values.starting_price = number(values.starting_price);
      values.sort_order = number(values.sort_order);
      values.features = lines(values.features);
      values.vehicle_prices = values.service_slug === 'car-wash' ? {
          hatch: number(values.price_hatch),
          sedan: number(values.price_sedan),
          suv: number(values.price_suv),
          luxury: number(values.price_luxury),
          minibus: number(values.price_minibus)
        } : {};
      delete values.price_hatch;
      delete values.price_sedan;
      delete values.price_suv;
      delete values.price_luxury;
      delete values.price_minibus;
      values.is_active = values.is_active === 'true';
      return values;
    });
    var packageForm = document.getElementById('packageForm');
    packageForm.elements.service_slug.addEventListener('change', function () {
      updateVehiclePriceFields(packageForm);
    });
    packageForm.addEventListener('reset', function () {
      window.setTimeout(function () { updateVehiclePriceFields(packageForm); }, 0);
    });
    updateVehiclePriceFields(packageForm);
    connectForm('sitePageForm', 'site_pages', prepareSitePage);
    var sitePageForm = document.getElementById('sitePageForm');
    var heroImageUrl = sitePageForm.elements.hero_image_url;
    var heroImageFile = sitePageForm.elements.hero_image_file;
    heroImageUrl.addEventListener('input', function () {
      if (heroImageUrl.value) heroImageFile.value = '';
    });
    heroImageFile.addEventListener('change', function () {
      if (getFormFile(sitePageForm, 'hero_image_file')) heroImageUrl.value = '';
    });
    sitePageForm.elements.slug.addEventListener('change', function (event) {
      var page = sitePages.find(function (item) { return item.slug === event.currentTarget.value; });
      if (page) editSitePage(event.currentTarget.form, page);
      else {
        var slug = event.currentTarget.value;
        event.currentTarget.form.reset();
        event.currentTarget.form.elements.slug.value = slug;
        event.currentTarget.form.elements.id.value = '';
      }
    });
    connectForm('planForm', 'membership_plans', function (values) {
      values.price = number(values.price);
      values.discount_percent = number(values.discount_percent);
      values.sort_order = number(values.sort_order);
      values.benefits = lines(values.benefits);
      values.is_active = values.is_active === 'true';
      return values;
    });
    connectForm('memberForm', 'members', function (values) {
      values.plan_id = nullableId(values.plan_id);
      values.joined_at = values.joined_at || undefined;
      return values;
    });
    connectForm('teamForm', 'team_members', uploadTeamPhoto, function (record, previous, saved) {
      if (previous.storage_path && previous.storage_path !== saved.storage_path) {
        return removeStoragePaths([previous.storage_path]);
      }
    });
    connectForm('galleryForm', 'work_gallery', function (values, form) {
      values.sort_order = number(values.sort_order);
      values.is_published = values.is_published === 'true';
      return uploadWork(form, values);
    }, cleanupReplacedGalleryFiles);
    var galleryForm = document.getElementById('galleryForm');
    galleryForm.elements.media_type.addEventListener('change', function () {
      updateGalleryMediaFields(galleryForm);
    });
    galleryForm.addEventListener('reset', function () {
      window.setTimeout(function () { updateGalleryMediaFields(galleryForm); }, 0);
    });
    updateGalleryMediaFields(galleryForm);

    document.getElementById('signOut').addEventListener('click', function () {
      client.auth.signOut().then(function (response) {
        if (response.error) throw response.error;
        dashboard.hidden = true;
        loginPanel.hidden = false;
        message(loginStatus, 'You have signed out.');
      }).catch(function (error) {
        console.error('Unable to sign out:', error);
        message(dashboardStatus, error.message || 'Unable to sign out.', true);
      });
    });
  }

  function enterDashboard(session) {
    return call(client.rpc('is_cleansmith_admin')).then(function (isAdmin) {
      if (!isAdmin) {
        return client.auth.signOut().then(function () {
          throw new Error('This account does not have the admin role. Ask the project owner to grant app_metadata.role = admin.');
        });
      }
      document.getElementById('userEmail').textContent = session.user.email || '';
      loginPanel.hidden = true;
      dashboard.hidden = false;
      return refresh();
    });
  }

  if (!configured()) {
    message(loginStatus, 'Configure the Supabase project URL and anon key in supabase-config.js to enable admin sign-in.', true);
    document.getElementById('loginForm').querySelectorAll('input,button').forEach(function (control) {
      control.disabled = true;
    });
    return;
  }

  client = window.CLEANSMITH_SUPABASE_CLIENT ||
    (window.CLEANSMITH_SUPABASE_CLIENT = window.supabase.createClient(config.url, config.anonKey));
  setupDashboard();
  document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    message(loginStatus, 'Signing in…');
    var values = formValues(event.currentTarget);
    client.auth.signInWithPassword({ email: values.email, password: values.password })
      .then(function (result) {
        if (result.error) throw result.error;
        return enterDashboard(result.data.session);
      }).catch(function (error) {
        console.error('CLEANSMITH sign-in failed:', error);
        message(loginStatus, error.message || 'Unable to sign in.', true);
      });
  });
  client.auth.getSession().then(function (result) {
    if (result.error) throw result.error;
    if (result.data.session) return enterDashboard(result.data.session);
  }).catch(function (error) {
    console.error('Unable to restore CLEANSMITH admin session:', error);
    message(loginStatus, error.message || 'Unable to restore the admin session.', true);
  });
  }

  window.CLEANSMITH_ADMIN_INIT = initializeAdmin;
})();
